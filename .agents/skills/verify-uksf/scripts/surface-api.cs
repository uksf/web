#:package Microsoft.CodeAnalysis.CSharp@5.9.0
#:property PublishAot=false

using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

string[] verbs = ["Get", "Post", "Put", "Patch", "Delete", "Head", "Options"];
var routing = new HashSet<string>(verbs.Select(verb => "Http" + verb)) { "Route", "AcceptVerbs" };
string[] providers = ["IRouteTemplateProvider", "IActionHttpMethodProvider", "IHttpMethodMetadata", "IRouteValueProvider"];

try
{
    var sources = JsonSerializer.Deserialize<Dictionary<string, string>>(Console.OpenStandardInput()) ?? throw new InvalidDataException("no sources on stdin");
    var options = CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Preview);
    var trees = sources.OrderBy(pair => pair.Key, StringComparer.Ordinal).Select(pair => CSharpSyntaxTree.ParseText(pair.Value, options, pair.Key)).ToList();
    foreach (var tree in trees)
    {
        var error = tree.GetDiagnostics().FirstOrDefault(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error);
        if (error is not null) Refuse(error.Location.SourceTree?.GetRoot().FindNode(error.Location.SourceSpan) ?? tree.GetRoot(), $"does not parse: {error.GetMessage()}");
        var disabled = tree.GetRoot().DescendantTrivia().FirstOrDefault(trivia => trivia.IsKind(SyntaxKind.DisabledTextTrivia));
        if (!disabled.IsKind(SyntaxKind.None)) Refuse(disabled.Token.Parent!, "has code disabled by #if");
    }
    var nodes = trees.SelectMany(tree => tree.GetRoot().DescendantNodes()).ToList();
    var ids = new SortedSet<string>(StringComparer.Ordinal);

    var aliases = nodes.OfType<UsingDirectiveSyntax>().Where(directive => directive.Alias is not null).Select(directive => directive.Alias!.Name.Identifier.ValueText).ToHashSet();
    var aliased = nodes.OfType<AttributeSyntax>().Select(attribute => (SyntaxNode)attribute.Name)
        .Concat(nodes.OfType<BaseTypeSyntax>().Select(base_ => base_.Type))
        .Concat(nodes.OfType<GenericNameSyntax>().Where(name => name.Identifier.ValueText == "MapHub").SelectMany(name => name.TypeArgumentList.Arguments))
        .FirstOrDefault(name => aliases.Contains(Name(name)) || aliases.Contains(Attribute(name)));
    if (aliased is not null) Refuse(aliased, "a using alias as an attribute, base type, or hub type is not supported");
    foreach (var type in nodes.OfType<BaseTypeDeclarationSyntax>())
        if (type.BaseList?.Types.Any(base_ => routing.Contains(Attribute(base_.Type)) || Attribute(base_.Type) == "HttpMethod" || providers.Contains(Name(base_.Type))) == true) Refuse(type, "declares a custom routing attribute");
    foreach (var method in nodes.OfType<MethodDeclarationSyntax>().Where(method => method.Identifier.ValueText == "MapHub"))
        Refuse(method, "declares a MapHub method");

    var consumed = new HashSet<AttributeSyntax>();
    var controllers = new List<(TypeDeclarationSyntax Type, List<string> Bases, List<(string Verb, string Template)> Actions)>();
    string[] markers = ["Controller", "ApiController", "NonController", "Route"];
    foreach (var type in nodes.OfType<TypeDeclarationSyntax>().Where(type => type is ClassDeclarationSyntax or RecordDeclarationSyntax))
    {
        var attributeNames = type.AttributeLists.SelectMany(list => list.Attributes).Select(attribute => Attribute(attribute.Name)).ToList();
        var baseNames = type.BaseList?.Types.Select(base_ => Name(base_.Type)).ToList() ?? [];
        var methods = type.Members.OfType<MethodDeclarationSyntax>().ToList();
        var candidate = type.Identifier.ValueText.EndsWith("Controller") || attributeNames.Any(markers.Contains) || baseNames.Any(name => name.EndsWith("Controller") || name.EndsWith("ControllerBase")) || methods.Any(method => Routing(method.AttributeLists).Count > 0);
        if (!candidate) continue;
        if (type.Modifiers.Any(SyntaxKind.PartialKeyword)) Refuse(type, $"partial controller {type.Identifier.ValueText} is not supported");
        if (attributeNames.Contains("NonController")) Refuse(type, "[NonController] is not supported");
        if (!type.Identifier.ValueText.EndsWith("Controller")) Refuse(type, "a controller name must end in Controller");
        if (baseNames.Count == 0 || baseNames[0] is not ("ControllerBase" or "Controller")) Refuse(type, "a controller must derive directly from ControllerBase or Controller");
        if (type.Parent is TypeDeclarationSyntax) Refuse(type, "nested controller is not supported");
        if (!type.Modifiers.Any(SyntaxKind.PublicKeyword)) Refuse(type, "controller is not public");
        if (type.Modifiers.Any(SyntaxKind.AbstractKeyword) || type.Modifiers.Any(SyntaxKind.StaticKeyword)) Refuse(type, "abstract or static controller is not supported");
        if (type.TypeParameterList is not null) Refuse(type, "generic controller is not supported");
        var bases = new List<string>();
        foreach (var attribute in Routing(type.AttributeLists))
        {
            if (Attribute(attribute.Name) != "Route") Refuse(attribute, "only [Route] is supported on a controller");
            bases.Add(Template(attribute, required: true));
            consumed.Add(attribute);
        }
        if (bases.Count == 0) Refuse(type, "controller without a class-level [Route]");
        var parsed = new List<(string, string)>();
        foreach (var method in methods)
        {
            var attributes = Routing(method.AttributeLists);
            var isPublic = method.Modifiers.Any(SyntaxKind.PublicKeyword) && !method.Modifiers.Any(SyntaxKind.StaticKeyword);
            var nonAction = method.AttributeLists.SelectMany(list => list.Attributes).Any(attribute => Attribute(attribute.Name) == "NonAction");
            if (attributes.Count == 0)
            {
                if (isPublic) Refuse(method, $"public method {method.Identifier.ValueText} has no verb attribute, so MVC treats it as an action");
                continue;
            }
            if (!isPublic || nonAction || method.TypeParameterList is not null || method.Modifiers.Any(SyntaxKind.AbstractKeyword) || method.Modifiers.Any(SyntaxKind.OverrideKeyword)) Refuse(method, "a routed method must be public, non-static, non-generic, non-override, and not [NonAction]");
            foreach (var attribute in attributes)
            {
                var name = Attribute(attribute.Name);
                if (!name.StartsWith("Http")) Refuse(attribute, $"[{name}] on an action is not supported");
                parsed.Add((name[4..].ToUpperInvariant(), Template(attribute, required: false)));
                consumed.Add(attribute);
            }
        }
        controllers.Add((type, bases, parsed));
    }
    var leftover = nodes.OfType<AttributeSyntax>().FirstOrDefault(attribute => routing.Contains(Attribute(attribute.Name)) && !consumed.Contains(attribute));
    if (leftover is not null) Refuse(leftover, "routing attribute outside a controller class or action method");

    foreach (var (type, bases, actions) in controllers)
    {
        var controller = Regex.Replace(type.Identifier.ValueText, "Controller$", "").ToLowerInvariant();
        foreach (var classTemplate in bases)
        {
            foreach (var (verb, template) in actions)
            {
                var path = Absolute(template) ? Trim(template) : string.Join("/", new[] { Trim(classTemplate), template }.Where(part => part.Length > 0));
                path = Regex.Replace(path, @"\[controller\]", controller, RegexOptions.IgnoreCase);
                if (path.Contains('[') || path.Contains(']')) Refuse(type, $"route token in /{path} is not supported");
                Add(type, $"api:{verb} /{path}");
            }
        }
    }

    foreach (var name in nodes.OfType<SimpleNameSyntax>().Where(name => name.Identifier.ValueText == "MapHub"))
    {
        if (name is not GenericNameSyntax generic || generic.TypeArgumentList.Arguments.Count != 1) Refuse(name, "MapHub without one type argument");
        var call = name.Parent is MemberAccessExpressionSyntax access && access.Name == name ? access.Parent : name.Parent;
        if (call is not InvocationExpressionSyntax) Refuse(name, "MapHub is not called directly");
        if (name.Parent is not MemberAccessExpressionSyntax) Refuse(name, "MapHub is not called on a route builder");
        Add(name, $"hub:{Name(((GenericNameSyntax)name).TypeArgumentList.Arguments[0])}");
    }

    var switches = nodes.Where(node => node is SwitchStatementSyntax or SwitchExpressionSyntax).Where(node => Regex.Replace((node is SwitchStatementSyntax statement ? statement.Expression : ((SwitchExpressionSyntax)node).GoverningExpression).ToString(), @"\s", "") == "gameServerEvent.Type").ToList();
    if (switches.Count != 1 || switches[0] is not SwitchStatementSyntax eventSwitch) throw new InvalidDataException($"expected exactly one switch statement on gameServerEvent.Type, found {switches.Count}");
    var cases = 0;
    foreach (var label in eventSwitch.Sections.SelectMany(section => section.Labels))
    {
        if (label is DefaultSwitchLabelSyntax) continue;
        if (label is not CaseSwitchLabelSyntax { Value: LiteralExpressionSyntax literal } || !literal.IsKind(SyntaxKind.StringLiteralExpression)) Refuse(label, "event case is not a string literal");
        Add(label, $"game:{((LiteralExpressionSyntax)((CaseSwitchLabelSyntax)label).Value).Token.ValueText}");
        cases++;
    }
    if (cases == 0) Refuse(eventSwitch, "the event switch has no cases");

    Console.Out.WriteLine("SURFACE-API " + JsonSerializer.Serialize(ids));

    void Add(SyntaxNode node, string id)
    {
        var value = id.StartsWith("api:") ? id[(id.IndexOf(' ') + 1)..] : id[(id.IndexOf(':') + 1)..];
        if (Regex.IsMatch(value, @"[\s\p{C}]")) Refuse(node, "an id contains whitespace or a control character");
        ids.Add(id);
    }
    return 0;
}
catch (InvalidDataException error)
{
    Console.Error.WriteLine(error.Message);
    return 2;
}

List<AttributeSyntax> Routing(SyntaxList<AttributeListSyntax> lists)
{
    foreach (var list in lists.Where(list => list.Target is not null))
        if (list.Attributes.Any(attribute => routing.Contains(Attribute(attribute.Name)))) Refuse(list, "routing attribute with a target specifier");
    return lists.SelectMany(list => list.Attributes).Where(attribute => routing.Contains(Attribute(attribute.Name))).ToList();
}

string Template(AttributeSyntax attribute, bool required)
{
    if (attribute.ArgumentList?.Arguments.Any(argument => argument.NameColon is not null) == true) Refuse(attribute, "named constructor arguments are not supported");
    var positional = attribute.ArgumentList?.Arguments.Where(argument => argument.NameEquals is null).ToList() ?? [];
    if (positional.Count == 0 && !required) return "";
    if (positional.Count != 1 || positional[0].Expression is not LiteralExpressionSyntax literal || !literal.IsKind(SyntaxKind.StringLiteralExpression)) Refuse(attribute, "route template is not one string literal");
    return ((LiteralExpressionSyntax)positional[0].Expression).Token.ValueText;
}

static bool Absolute(string template) => template.StartsWith('/') || template.StartsWith("~/");

static string Trim(string template) => Regex.Replace(template, @"^~?/", "").TrimEnd('/');

static string Name(SyntaxNode type) => type switch
{
    QualifiedNameSyntax qualified => qualified.Right.Identifier.ValueText,
    AliasQualifiedNameSyntax alias => alias.Name.Identifier.ValueText,
    SimpleNameSyntax simple => simple.Identifier.ValueText,
    _ => type.ToString(),
};

static string Attribute(SyntaxNode type) => Regex.Replace(Name(type), "Attribute$", "");

static void Refuse(SyntaxNode node, string message)
{
    var line = node.GetLocation().GetLineSpan();
    throw new InvalidDataException($"{line.Path}:{line.StartLinePosition.Line + 1}: {message}: {Regex.Replace(node.ToString(), @"\s+", " ")[..Math.Min(80, Regex.Replace(node.ToString(), @"\s+", " ").Length)]}");
}
