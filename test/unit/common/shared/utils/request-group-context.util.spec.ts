import { ForbiddenException } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import {
  assertReqGroup,
  isSysCtx,
  reqGroupId,
} from '@/common/shared/utils/request-group-context.util';

describe('request-group-context.util', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isSysCtx', () => {
    it('true when context.type is system', () => {
      jest
        .spyOn(RequestContext, 'get')
        .mockImplementation((key: string) =>
          key === 'context' ? { type: 'system' } : undefined,
        );
      expect(isSysCtx()).toBe(true);
    });

    it('false otherwise', () => {
      jest.spyOn(RequestContext, 'get').mockReturnValue(undefined);
      expect(isSysCtx()).toBe(false);
    });
  });

  describe('reqGroupId', () => {
    it('returns groupId from context', () => {
      jest
        .spyOn(RequestContext, 'get')
        .mockImplementation((key: string) =>
          key === 'groupId' ? 42 : undefined,
        );
      expect(reqGroupId()).toBe(42);
    });
  });

  describe('assertReqGroup', () => {
    it('throws when missing context or groupId', () => {
      jest.spyOn(RequestContext, 'get').mockReturnValue(undefined);
      expect(() => assertReqGroup()).toThrow(ForbiddenException);
    });

    it('passes when both set', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 1;
        return undefined;
      });
      expect(() => assertReqGroup()).not.toThrow();
    });
  });
});
