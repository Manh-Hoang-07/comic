import { RequestContext } from '@/common/shared/utils';

/**
 * Normalizes input to an array.
 */
export function normalizeIdArray(input: any): any[] | null {
    if (input === undefined) return null;
    if (!Array.isArray(input)) return [];
    return input;
}

/**
 * Unified transformer for Permission objects in Role/Permission responses.
 */
export function transformPermission(perm: any) {
    if (!perm) return null;
    const { id, code, name, status } = perm;
    return { id, code, name, status };
}

/**
 * Unified transformer for Context objects in Role responses.
 */
export function transformContext(ctx: any) {
    if (!ctx) return null;
    return {
        id: ctx.id,
        type: ctx.type,
        name: ctx.name,
        status: ctx.status,
        ref_id: ctx.ref_id,
    };
}

/**
 * Logic for filtering and transforming roles' contexts based on current request context.
 */
export function resolveRoleContexts(roleContexts: any[]) {
    if (!roleContexts?.length) return { context_ids: [], contexts: [] };

    const currentContextId = RequestContext.get<any>('contextId') || null;
    const currentContext = RequestContext.get<any>('context');

    let filtered = roleContexts;
    if (currentContext && currentContext.type !== 'system') {
        filtered = roleContexts.filter((rc) => rc.context_id === currentContextId);
    }

    return {
        context_ids: filtered.map((rc) => rc.context_id),
        contexts: filtered.filter((rc) => rc.context).map((rc) => transformContext(rc.context)),
    };
}
