import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import LLMDocsButton from './LLMDocsButton';
import type {ComponentType} from 'react';

/**
 * 扩展导航栏组件类型映射：
 * 在 Docusaurus 自带类型（default/dropdown/search 等）基础上，
 * 注册自定义类型 custom-LLMDocsButton（对应配置中的 navbar.items 项）。
 */
const CustomComponentTypes: Record<string, ComponentType> = {
  ...ComponentTypes,
  'custom-LLMDocsButton': LLMDocsButton,
};

export default CustomComponentTypes;