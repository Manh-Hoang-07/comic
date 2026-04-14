import { ForbiddenException } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils/request-context.util';

/** Request đang ở context system (super admin). */
export function isSysCtx(): boolean {
  return (
    RequestContext.get<{ type?: string } | null>('context')?.type === 'system'
  );
}

/** `groupId` gắn với request (header / middleware). */
export function reqGroupId(): any {
  return RequestContext.get<any>('groupId');
}

/** Tenant phải có `context` + `groupId`, không thì 403. */
export function assertReqGroup(): void {
  const context = RequestContext.get<any>('context');
  const gid = reqGroupId();
  if (!context || gid === undefined || gid === null) {
    throw new ForbiddenException('No context available');
  }
}
