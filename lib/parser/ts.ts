import * as t from '@babel/types';
import { ITypeAnnotation } from '../../types/openapi';

const BasicType: Record<string, string> = {
  TSNumberKeyword: 'number',
  TSStringKeyword: 'string',
};

export function t_TSTypeAnnotation(node?: t.TSTypeAnnotation | null): ITypeAnnotation {
  if (!node) return '';
  const { typeAnnotation } = node;
  const type = typeAnnotation.type;

  if (t.isTSTypeReference(typeAnnotation)) {
    const { typeName } = typeAnnotation;
    if (t.isIdentifier(typeName)) {
      const { name } = typeName;
    }
  } else if (t.isTSTypeLiteral(typeAnnotation)) {
    const { members } = typeAnnotation;
    const obj: ITypeAnnotation = {};

    members.forEach((member) => {
      if (t.isTSPropertySignature(member)) {
        const { key, typeAnnotation } = member;
        if (t.isIdentifier(key)) {
          const name = key.name;
          const type = t_TSTypeAnnotation(typeAnnotation);
          obj[name] = type;
        }
      }
    });
    return obj;
  }

  return BasicType[type];
}
