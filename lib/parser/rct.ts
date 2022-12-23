import * as t from '@babel/types';
import { IParam, ParamType } from '../../types/openapi';
import { ROUTINGPARAMS, RoutingParamType } from '../../types/rct';
import * as tsParser from './ts';

export function param(node: t.Identifier) {
  const { typeAnnotation, decorators } = node;

  let type: Record<string, any> | string;
  if (t.isTSTypeAnnotation(typeAnnotation)) {
    type = tsParser.t_TSTypeAnnotation(typeAnnotation.typeAnnotation);
  }

  const parameters: IParam[] = [];

  decorators?.forEach((decorator) => {
    const { expression } = decorator;

    if (t.isCallExpression(expression)) {
      const { callee, arguments: args } = expression;

      if (t.isIdentifier(callee)) {
        const name = callee.name as RoutingParamType;

        let httpType: ParamType = 'body';

        switch (name) {
          case RoutingParamType.queryParam:
            httpType = 'query';
            break;
          case RoutingParamType.bodyParam:
            httpType = 'body';
            break;
          case RoutingParamType.param:
            httpType = 'query';
            break;
          case RoutingParamType.body:
            httpType = 'body';
            break;
          default:
        }

        if (ROUTINGPARAMS.includes(name)) {
          switch (name) {
            case RoutingParamType.bodyParam:
            case RoutingParamType.queryParam:
            case RoutingParamType.param:
              const arg = args[0];
              let paramName;
              if (t.isStringLiteral(arg)) {
                paramName = arg.value;
                parameters.push({ type: httpType, typeAnnotation: type, name: paramName });
              }
              break;
            case RoutingParamType.body:
            case RoutingParamType.queryParams:
              Object.entries(type).forEach(([key, value]) => {
                parameters.push({ type: httpType, typeAnnotation: value, name: key });
              });
              break;
            default:
          }
        }
      }
    }
  });
  return parameters;
}
