interface Route {
  method: string;
  path: string;
}

interface Body {}
interface Parameter {}

export interface Api {
  routes: Route[];
  description: string;
  bodys: Body[];
  parameters: Parameter[];
  tags: string[];
  name: string;
}
