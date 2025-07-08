import type { MenuFactory } from '@mantine/core';
import type { StylesApiData } from '../types';
import { PopoverStylesApi } from './Popover.styles-api';

export const MenuStylesApi: StylesApiData<MenuFactory> = {
  selectors: {
    ...PopoverStylesApi.selectors,
    divider: '`Menu.Divider` root element',
    label: '`Menu.Label` root element',
    item: '`Menu.Item` root element',
    itemLabel: 'Label of `Menu.Item`',
    itemSection: 'Left and right sections of `Menu.Item`',
    chevron: 'Sub menu chevron',
  },

  vars: {},

  modifiers: [
    {
      modifier: 'data-disabled',
      selector: 'item',
      condition: '`disabled` prop is set on `Menu.Item`',
    },
  ],
};
