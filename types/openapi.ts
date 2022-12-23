interface RootRoute {
  method: string;
  path: string;
}

export type ParamType = 'query' | 'path' | 'body' | 'head';

export type ITypeAnnotation = string | Record<string, any>;

export interface IParam {
  type?: ParamType;
  name?: string;
  typeAnnotation?: ITypeAnnotation;
}

export interface Route {
  rootRoutes: RootRoute[];
  description: string;
  parameters: IParam[];
  response: ITypeAnnotation;
  tags: string[];
  name: string;
}
