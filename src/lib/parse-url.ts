interface ZeplinScreenUrl {
  projectId: string;
  screenId: string;
}

export function parseZeplinScreenUrl(rawUrl: string): ZeplinScreenUrl {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`유효하지 않은 URL입니다: ${rawUrl}`);
  }

  if (url.hostname !== "app.zeplin.io") {
    throw new Error(
      `Zeplin URL이 아닙니다. "app.zeplin.io" 호스트가 필요합니다: ${rawUrl}`,
    );
  }

  const segments = url.pathname.split("/").filter(Boolean);

  const projectIndex = segments.indexOf("project");
  const screenIndex = segments.indexOf("screen");

  const projectId =
    projectIndex !== -1 ? segments[projectIndex + 1] : undefined;
  const screenId = screenIndex !== -1 ? segments[screenIndex + 1] : undefined;

  if (!projectId || !screenId) {
    throw new Error(
      `URL에서 projectId 또는 screenId를 찾을 수 없습니다. 예상 형식: https://app.zeplin.io/project/{projectId}/screen/{screenId}`,
    );
  }

  return { projectId, screenId };
}
