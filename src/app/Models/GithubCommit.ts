export interface GithubCommit {
    id: string;
    message: string;
    author: GithubCommitAuthor;
}

export interface GithubCommitAuthor {
    username: string;
    email: string;
}
