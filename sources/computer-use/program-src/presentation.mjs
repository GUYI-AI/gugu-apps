const verbs = { click: '点击', double_click: '双击', right_click: '右键点击', drag: '拖动', scroll: '滚动',
  type_text: '输入', press_key: '按键', hotkey: '按键', set_value: '填写', invoke_menu: '选择菜单',
  launch_app: '打开 App', set_window_frame: '调整窗口', get_window_state: '查看窗口',
  get_accessibility_tree: '查看窗口', list_apps: '查看打开的 App', list_windows: '查看窗口', zoom: '放大查看', run_steps: '连续操作' };

export const presentationTarget = (target, revision) => target?.pid && target?.window_id
  ? { id: `computer:${target.pid}:${target.window_id}`, revision: revision + 1 } : null;

/** These are captured native coordinates and admitted action results, never inferred from video readiness. */
export function computerPresentation(frame, target, cursor, action, actionId, paused) {
  if (!target || !frame?.target) return null;
  const label = action && (verbs[action.tool] ?? '操作');
  return {
    frame: { sequence: frame.sequence, width: frame.width, height: frame.height, target: { ...frame.target } },
    targetLabel: String(target.app || '电脑').slice(0, 200),
    ...(cursor && Number.isFinite(cursor.x) && Number.isFinite(cursor.y) && cursor.x >= 0 && cursor.y >= 0
      && cursor.x < frame.width && cursor.y < frame.height ? { cursor: { x: cursor.x, y: cursor.y,
        ...(cursor.click === true ? { click: String(cursor.revision).slice(0, 128) } : {}) } } : {}),
    ...(action ? { action: { id: actionId, phase: paused ? 'paused' : action.status,
      label: `${paused ? '已暂停' : action.status === 'running' ? '正在' : action.status === 'failed' ? '没能' : '已'}${label}` } } : {}),
  };
}
