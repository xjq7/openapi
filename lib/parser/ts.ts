import * as t from '@babel/types';
import { ITypeAnnotation } from '../../types/openapi';

const BasicType: Record<string, string> = {
  TSNumberKeyword: 'number',
  TSStringKeyword: 'string',
  TSBooleanKeyword: 'boolean',
};

function genericType(typeAnnotation?: t.TSTypeReference | null) {
  let parameters: t.TSTypeReference['typeParameters'];
  if (t.isTSTypeReference(typeAnnotation)) {
    parameters = typeAnnotation.typeParameters;
  }

  return (parameters: t.TSTypeParameterInstantiation | null) => {};
}

export function t_TSTypeAnnotation(typeAnnotation?: t.TSType): ITypeAnnotation {
  if (t.isTSTypeReference(typeAnnotation)) {
    const { typeParameters } = typeAnnotation;
    const params = typeParameters?.params || [];
    const _params = params.map((param) => {
      return t_TSTypeAnnotation(param);
    });
    console.log(_params);
  } else if (t.isTSTypeLiteral(typeAnnotation)) {
    const { members } = typeAnnotation;
    const obj: ITypeAnnotation = {};
    members.forEach((member) => {
      if (t.isTSPropertySignature(member)) {
        const { name, type } = t_TSPropertySignature(member);
        if (name && type) {
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
    return BasicType[type];
  } else if (t.isTSAnyKeyword(typeAnnotation) || t.isTSObjectKeyword(typeAnnotation)) {
    return 'object';
  } else if (t.isTSNullKeyword(typeAnnotation)) {
    return 'null';
  }
  return 'object';
}

export function t_TSPropertySignature(node: t.TSPropertySignature) {
  const { key, typeAnnotation } = node;
  if (t.isIdentifier(key)) {
    const name = key.name;
    let type = t_TSTypeAnnotation(typeAnnotation?.typeAnnotation);
    return { name, type };
  }
  return {};
}
