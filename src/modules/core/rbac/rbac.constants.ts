
export enum ContextType {
    SYSTEM = 'system',
    ORGANIZATION = 'organization',
    GROUP = 'group'
}

export const SYSTEM_CONTEXT_CODE = 'system';

export enum RbacPermission {
    SYSTEM_MANAGE = 'system.manage',
    GROUP_MANAGE = 'group.manage',
    GROUP_MEMBER_ADD = 'group.member.add',
    GROUP_MEMBER_MANAGE = 'group.member.manage',
    AUTHENTICATED = 'authenticated',
    USER = 'user'
}

/**
 * Tập hợp hằng số quyền (Single Source of Truth)
 * Các string giá trị ở đây PHẢI TRÙNG với cột 'code' trong bảng 'permissions' của DB.
 */
export const PERM = {
    SYSTEM: {
        MANAGE: 'system.manage',
    },
    ROLE: {
        MANAGE: 'role.manage', // Quyền chính bạn đang dùng
    }
};
