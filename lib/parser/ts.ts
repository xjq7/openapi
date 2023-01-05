import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ITypeAnnotation } from '../../types/openapi';
import * as commonParser from '../parser/common';
import path from 'path';

const BasicType: Record<string, string> = {
  TSNumberKeyword: 'integer',
  TSStringKeyword: 'string',
  TSBooleanKeyword: 'boolean',
};

type TypeType = 'plain' | 'reference';

type TSType =
  | 'TSUnionType'
  | 'TSIntersectionType'
  | 'TSTypeReference'
  | 'TSArrayType'
  | 'TSTupleType'
  | 'TSIndexSignature';

interface TypeObj {
  type: TypeType;
  reference: Dependence;
  name: string | ITypeAnnotation;
  parameter: ParamTypeObj[];
}

interface ParamTypeObj {
  default?: TypeObj;
  name: string;
}

interface Dependence {
  type: TypeObj;
  name: string;
}

/**
 * 依赖解析器, 存储所有依赖
 *
 * @export
 * @class ModuleParser
 */
export class ModuleParser {
  private modules: Record<string, Record<string, any>> = {};

  public t_TSTypeAnnotation(typeAnnotation?: t.TSType | null): ITypeAnnotation {
    const _this = this;
    if (t.isTSTypeReference(typeAnnotation)) {
      const { typeParameters, typeName } = typeAnnotation;
      const params = typeParameters?.params || [];
      console.log(typeAnnotation, 'params');
    } else if (t.isTSTypeLiteral(typeAnnotation)) {
      const { members } = typeAnnotation;
      const obj: ITypeAnnotation = {};
      members.forEach((member) => {
        if (t.isTSPropertySignature(member)) {
          const { key, typeAnnotation } = member;
          if (t.isIdentifier(key)) {
            const name = key.name;
            let type = this.t_TSTypeAnnotation(typeAnnotation?.typeAnnotation);
            obj[name] = type;
          }
        }
      });
      return obj;
    } else if (
      t.isTSBooleanKeyword(typeAnnotation) ||
      t.isTSStringKeyword(typeAnnotation) ||
      t.isTSNumberKeyword(typeAnnotation)
    ) {
      const { type } = typeAnnotation;
      return { type: BasicType[type] };
    } else if (t.isTSAnyKeyword(typeAnnotation) || t.isTSObjectKeyword(typeAnnotation)) {
      return { type: 'object' };
    } else if (t.isTSNullKeyword(typeAnnotation) || t.isTSUndefinedKeyword(typeAnnotation)) {
      return { type: 'null' };
    }
    return { type: 'object' };
  }

  private genericType(typeAnnotation?: t.TSTypeReference | t.TSInterfaceDeclaration | null) {
    let parameters: t.TSTypeReference['typeParameters'];
    if (t.isTSTypeReference(typeAnnotation)) {
      parameters = typeAnnotation.typeParameters;
    }
    3;

    return (parameters: t.TSTypeParameterInstantiation | null) => {};
  }

  public t_TSTypeDeclaration(path: any) {}

  private t_TSInterfaceBody(node: t.TSInterfaceBody) {
    const _this = this;
    const { body } = node;

    let obj: Record<string, any> = {};

    if (t.isTSInterfaceBody(body)) {
      const bodys = body['body'];
      bodys.forEach((body) => {
        if (t.isTSPropertySignature(body)) {
          const { key, typeAnnotation } = body;
          if (t.isIdentifier(key)) {
            const { name } = key;
            let value: any;
            if (typeAnnotation) {
              const { typeAnnotation: _typeAnnotation } = typeAnnotation;

              if (t.isTSTypeReference(_typeAnnotation)) {
                const { typeName } = _typeAnnotation;
              } else {
                value = _this.t_TSTypeAnnotation(_typeAnnotation);
              }
            }
            obj[name] = value;
          }
        }
      });
    }
  }

  parse(filePath: string) {
    const _this = this;

    // 文件已解析过, 已缓存
    if (this.get(filePath)) return;

    const ast = commonParser.ASTparse(filePath);
    const module: Record<string, Record<string, any>> = {};

    traverse(ast, {
      TSInterfaceDeclaration: {
        enter(path) {
          const { id, typeParameters, body } = path.node;

          if (t.isTSTypeParameterDeclaration(typeParameters)) {
            let { params } = typeParameters;
            const parameters = params.map((param) => {
              const { name, default: _default } = param;
              return { name, default: _this.t_TSTypeAnnotation(_default) };
            });

            let obj: Record<string, any> = {};

            if (t.isTSInterfaceBody(body)) {
              const bodys = body['body'];
              bodys.forEach((body) => {
                if (t.isTSPropertySignature(body)) {
                  const { key, typeAnnotation } = body;
                  if (t.isIdentifier(key)) {
                    const { name } = key;
                    let value: any;
                    if (typeAnnotation) {
                      const { typeAnnotation: _typeAnnotation } = typeAnnotation;

                      if (t.isTSTypeReference(_typeAnnotation)) {
                        const { typeName } = _typeAnnotation;
                        if (t.isIdentifier(typeName)) {
                          const { name } = typeName;
                          const findParameter = parameters.find((o) => {
                            return o.name === name;
                          });

                          if (findParameter) {
                            value = findParameter;
                          } else {
                            value = _this.get(filePath)[name];
                          }
                        }
                      } else {
                        value = _this.t_TSTypeAnnotation(_typeAnnotation);
                      }
                    }
                    obj[name] = value;
                  }
                }
              });
            }

            if (t.isIdentifier(id)) {
              const { name } = id;
              _this.modules[filePath][name] = obj;
            }
          }
        },
      },

      ImportDeclaration: {
        enter(_path) {
          const { source } = _path.node;
          if (t.isStringLiteral(source)) {
            const { value } = source;
            _this.parse(path.resolve(value));
          }
        },
      },
    });

    const externalModule: Record<string, Record<string, any>> = {};

    traverse(ast, {
      ExportDefaultDeclaration: {
        enter(_path) {
          const { declaration } = _path.node;
          if (t.isIdentifier(declaration)) {
            const { name } = declaration;
            externalModule['default'] = module[name];
          }
        },
      },
      ExportNamedDeclaration: {
        enter(_path) {
          const { declaration } = _path.node;
          if (t.isIdentifier(declaration)) {
            const { name } = declaration;
            externalModule[name] = module[name];
          }
        },
      },
    });
    console.log(module);

    this.modules[filePath] = externalModule;
    console.log(this.modules[filePath]);
  }
  get(filePath: string) {
    return this.modules[filePath];
  }
}
