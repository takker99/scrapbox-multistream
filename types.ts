export interface ProjectResponse {
  projectName: string; // data取得先のproject名
  skip: number; // parameterに渡したskipと同じ
  limit: number; // parameterに渡したlimitと同じ
  count: number; // projectの全ページ数 (中身のないページを除く)
  pages: {
    id: string;
    title: string;
    image: string | null;
    descriptions: string[];
    user: { id: string };
    pin: number; // pinされてないときは0
    views: number;
    linked: number;
    commitId: string;
    created: number;
    updated: number;
    accessed: number;
    snapshotCreated: number | null;
    pageRank: number;
  }[];
}
