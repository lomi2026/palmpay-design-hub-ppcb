'use client';

import { useEffect } from 'react';

export function LocalizedValidation() {
  useEffect(() => {
    const owned = new WeakSet<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();
    function control(target: EventTarget | null) {
      return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement ? target : null;
    }
    function invalid(event: Event) {
      const input = control(event.target);
      if (!input) return;
      if (owned.has(input)) input.setCustomValidity('');
      if (input.validity.customError) return;
      const v = input.validity;
      const message = v.valueMissing ? '请填写此项。'
        : v.typeMismatch ? (input instanceof HTMLInputElement && input.type === 'email' ? '请输入有效的邮箱地址。' : '请输入有效的链接地址。')
        : v.tooLong ? '输入内容过长，请缩短后重试。'
        : v.tooShort ? '输入内容过短，请补充后重试。'
        : v.rangeOverflow ? '输入的数值超过允许范围。'
        : v.rangeUnderflow ? '输入的数值低于允许范围。'
        : '输入格式不正确，请检查后重试。';
      input.setCustomValidity(message);
      owned.add(input);
    }
    function clear(event: Event) {
      const input = control(event.target);
      if (input && owned.has(input)) {
        input.setCustomValidity('');
        owned.delete(input);
      }
    }
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('input', clear, true);
    document.addEventListener('change', clear, true);
    return () => {
      document.removeEventListener('invalid', invalid, true);
      document.removeEventListener('input', clear, true);
      document.removeEventListener('change', clear, true);
    };
  }, []);
  return null;
}
