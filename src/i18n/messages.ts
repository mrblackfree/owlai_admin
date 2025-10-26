export const errorMessages = {
  ko: {
    // 일반 에러
    NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',
    INTERNAL_ERROR: '내부 서버 오류가 발생했습니다',
    VALIDATION_ERROR: '입력 데이터가 올바르지 않습니다',
    UNAUTHORIZED: '인증이 필요합니다',
    FORBIDDEN: '접근 권한이 없습니다',
    BAD_REQUEST: '잘못된 요청입니다',
    
    // 도구 관련
    TOOL_NOT_FOUND: '도구를 찾을 수 없습니다',
    TOOL_ALREADY_EXISTS: '이미 존재하는 도구입니다',
    TOOL_CREATE_FAILED: '도구 생성에 실패했습니다',
    TOOL_UPDATE_FAILED: '도구 업데이트에 실패했습니다',
    TOOL_DELETE_FAILED: '도구 삭제에 실패했습니다',
    
    // 사용자 관련
    USER_NOT_FOUND: '사용자를 찾을 수 없습니다',
    USER_UPDATE_FAILED: '사용자 정보 업데이트에 실패했습니다',
    
    // 리뷰 관련
    REVIEW_NOT_FOUND: '리뷰를 찾을 수 없습니다',
    REVIEW_CREATE_FAILED: '리뷰 작성에 실패했습니다',
    
    // 블로그/뉴스 관련
    POST_NOT_FOUND: '게시물을 찾을 수 없습니다',
    POST_CREATE_FAILED: '게시물 생성에 실패했습니다',
    POST_UPDATE_FAILED: '게시물 업데이트에 실패했습니다',
    
    // 데이터베이스 관련
    DB_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다',
    DB_QUERY_FAILED: '데이터베이스 쿼리 실행에 실패했습니다',
  },
  en: {
    // General errors
    NOT_FOUND: 'Resource not found',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Invalid input data',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    BAD_REQUEST: 'Bad request',
    
    // Tool related
    TOOL_NOT_FOUND: 'Tool not found',
    TOOL_ALREADY_EXISTS: 'Tool already exists',
    TOOL_CREATE_FAILED: 'Failed to create tool',
    TOOL_UPDATE_FAILED: 'Failed to update tool',
    TOOL_DELETE_FAILED: 'Failed to delete tool',
    
    // User related
    USER_NOT_FOUND: 'User not found',
    USER_UPDATE_FAILED: 'Failed to update user',
    
    // Review related
    REVIEW_NOT_FOUND: 'Review not found',
    REVIEW_CREATE_FAILED: 'Failed to create review',
    
    // Blog/News related
    POST_NOT_FOUND: 'Post not found',
    POST_CREATE_FAILED: 'Failed to create post',
    POST_UPDATE_FAILED: 'Failed to update post',
    
    // Database related
    DB_CONNECTION_FAILED: 'Database connection failed',
    DB_QUERY_FAILED: 'Database query failed',
  }
};

export const successMessages = {
  ko: {
    TOOL_CREATED: '도구가 성공적으로 생성되었습니다',
    TOOL_UPDATED: '도구가 업데이트되었습니다',
    TOOL_DELETED: '도구가 삭제되었습니다',
    REVIEW_CREATED: '리뷰가 작성되었습니다',
    POST_CREATED: '게시물이 생성되었습니다',
    POST_UPDATED: '게시물이 업데이트되었습니다',
    POST_DELETED: '게시물이 삭제되었습니다',
    USER_UPDATED: '사용자 정보가 업데이트되었습니다',
  },
  en: {
    TOOL_CREATED: 'Tool created successfully',
    TOOL_UPDATED: 'Tool updated successfully',
    TOOL_DELETED: 'Tool deleted successfully',
    REVIEW_CREATED: 'Review created successfully',
    POST_CREATED: 'Post created successfully',
    POST_UPDATED: 'Post updated successfully',
    POST_DELETED: 'Post deleted successfully',
    USER_UPDATED: 'User updated successfully',
  }
};

// Helper function to get message based on language
export const getMessage = (
  messageKey: string,
  lang: 'ko' | 'en' = 'ko',
  type: 'error' | 'success' = 'error'
): string => {
  const messages = type === 'error' ? errorMessages : successMessages;
  return messages[lang][messageKey as keyof typeof messages.ko] || messageKey;
};

