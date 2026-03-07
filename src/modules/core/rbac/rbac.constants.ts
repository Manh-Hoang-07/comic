
export enum ContextType {
    SYSTEM = 'system',
    ORGANIZATION = 'organization',
    GROUP = 'group'
}

export enum RbacPermission {
    SYSTEM_MANAGE = 'system.manage',
    GROUP_MANAGE = 'group.manage',
    GROUP_MEMBER_ADD = 'group.member.add',
    GROUP_MEMBER_MANAGE = 'group.member.manage',
    AUTHENTICATED = 'authenticated',
    USER = 'user'
}

export const SYSTEM_CONTEXT_CODE = 'system';
