export function isApiError(
  error: unknown,
): error is { response: { status: number } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response: unknown }).response === "object" &&
    (error as { response: object | null }).response !== null &&
    "status" in (error as { response: { status: unknown } }).response &&
    typeof (error as { response: { status: unknown } }).response.status ===
      "number"
  );
}

export function getApiErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "인증에 실패했습니다. ZEPLIN_TOKEN을 확인해주세요.";
    case 403:
      return "해당 리소스에 접근할 권한이 없습니다.";
    case 404:
      return "스크린을 찾을 수 없습니다. URL을 확인해주세요.";
    default:
      return `API 요청에 실패했습니다. (상태 코드: ${String(status)})`;
  }
}
