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

    foreach (var alias in nodes.OfType<UsingDirectiveSyntax>().Where(directive => directive.Alias is not null))
        if (alias.NamespaceOrType is TypeSyntax target && routing.Contains(Attribute(target))) Refuse(alias, "aliases a routing attribute");
    foreach (var type in nodes.OfType<BaseTypeDeclarationSyntax>())
        if (type.BaseList?.Types.Any(base_ => routing.Contains(Attribute(base_.Type)) || providers.Contains(Name(base_.Type))) == true) Refuse(type, "declares a custom routing attribute");

    var consumed = new HashSet<AttributeSyntax>();
    var types = nodes.OfType<TypeDeclarationSyntax>().ToList();
    var withActions = new HashSet<string>();
    var controllers = new List<(TypeDeclarationSyntax Type, List<string> Bases, List<(string Verb, string Template)> Actions)>();
    foreach (var type in types)
    {
        var classAttributes = Routing(type.AttributeLists);
        var actions = type.Members.OfType<MethodDeclarationSyntax>().Select(method => (Method: method, Attributes: Routing(method.AttributeLists))).Where(pair => pair.Attributes.Count > 0).ToList();
        if (classAttributes.Count == 0 && actions.Count == 0) continue;
        if (type.Modifiers.Any(SyntaxKind.PartialKeyword)) Refuse(type, $"partial controller {type.Identifier.ValueText} is not supported");
        if (type.Parent is TypeDeclarationSyntax) Refuse(type, "nested controller is not supported");
        if (!type.Modifiers.Any(SyntaxKind.PublicKeyword)) Refuse(type, "routed type is not public");
        if (type.Modifiers.Any(SyntaxKind.AbstractKeyword) || type.Modifiers.Any(SyntaxKind.StaticKeyword)) Refuse(type, "abstract or static routed type is not supported");
        if (type.TypeParameterList is not null) Refuse(type, "generic controller is not supported");
        var bases = new List<string>();
        foreach (var attribute in classAttributes)
        {
            if (Attribute(attribute.Name) != "Route") Refuse(attribute, "only [Route] is supported on a controller");
            bases.Add(Template(attribute, required: true));
            consumed.Add(attribute);
        }
        if (actions.Count > 0 && bases.Count == 0) Refuse(type, "actions without a class-level [Route]");
        var parsed = new List<(string, string)>();
        foreach (var (method, attributes) in actions)
        {
            if (!method.Modifiers.Any(SyntaxKind.PublicKeyword) || method.Modifiers.Any(SyntaxKind.StaticKeyword) || method.Modifiers.Any(SyntaxKind.AbstractKeyword)) Refuse(method, "a routed method must be public, non-static, and non-abstract");
            if (method.AttributeLists.SelectMany(list => list.Attributes).Any(other => Attribute(other.Name) == "NonAction")) Refuse(method, "[NonAction] with a routing attribute");
            foreach (var attribute in attributes)
            {
                var name = Attribute(attribute.Name);
                if (!name.StartsWith("Http")) Refuse(attribute, $"[{name}] on an action is not supported");
                parsed.Add((name[4..].ToUpperInvariant(), Template(attribute, required: false)));
                consumed.Add(attribute);
            }
        }
        if (parsed.Count > 0) withActions.Add(type.Identifier.ValueText);
        controllers.Add((type, bases, parsed));
    }
    foreach (var type in types)
    {
        var inherited = type.BaseList?.Types.Select(base_ => Name(base_.Type)).FirstOrDefault(withActions.Contains);
        if (inherited is not null) Refuse(type, $"inherits routed actions from {inherited}");
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
                ids.Add($"api:{verb} /{path}");
            }
        }
    }

    foreach (var name in nodes.OfType<SimpleNameSyntax>().Where(name => name.Identifier.ValueText == "MapHub"))
    {
        if (name is not GenericNameSyntax generic || generic.TypeArgumentList.Arguments.Count != 1) Refuse(name, "MapHub without one type argument");
        var call = name.Parent is MemberAccessExpressionSyntax access && access.Name == name ? access.Parent : name.Parent;
        if (call is not InvocationExpressionSyntax) Refuse(name, "MapHub is not called directly");
        ids.Add($"hub:{Name(((GenericNameSyntax)name).TypeArgumentList.Arguments[0])}");
    }

    var switches = nodes.Where(node => node is SwitchStatementSyntax or SwitchExpressionSyntax).Where(node => Regex.Replace((node is SwitchStatementSyntax statement ? statement.Expression : ((SwitchExpressionSyntax)node).GoverningExpression).ToString(), @"\s", "") == "gameServerEvent.Type").ToList();
    if (switches.Count != 1 || switches[0] is not SwitchStatementSyntax eventSwitch) throw new InvalidDataException($"expected exactly one switch statement on gameServerEvent.Type, found {switches.Count}");
    var cases = 0;
    foreach (var label in eventSwitch.Sections.SelectMany(section => section.Labels))
    {
        if (label is DefaultSwitchLabelSyntax) continue;
        if (label is not CaseSwitchLabelSyntax { Value: LiteralExpressionSyntax literal } || !literal.IsKind(SyntaxKind.StringLiteralExpression)) Refuse(label, "event case is not a string literal");
        ids.Add($"game:{((LiteralExpressionSyntax)((CaseSwitchLabelSyntax)label).Value).Token.ValueText}");
        cases++;
    }
    if (cases == 0) Refuse(eventSwitch, "the event switch has no cases");

    Console.Out.Write(string.Join("\n", ids));
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
    var positional = attribute.ArgumentList?.Arguments.Where(argument => argument.NameEquals is null && argument.NameColon is null).ToList() ?? [];
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
