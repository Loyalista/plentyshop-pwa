import type { BlocksList } from '~/composables/useBlocksList/types';
import type { Block } from '@plentymarkets/shop-api';

const blocksList = {
  'loyalista-product-points': {
    category: 'loyalista-product-points',
    accessControl: ['product'],
    title: 'Loyalista',
    blockName: 'LoyalistaProductPoints',
    variations: [
      {
        title: 'Loyalista Product Points',
        template: {
          en: {
            name: 'LoyalistaProductPoints',
            type: 'content',
            meta: {
              uuid: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b',
              isGlobalTemplate: false,
            },
            content: {
              dropShadow: true,
              borders: true,
              borderColor: '#E5E7EB',
              backgroundColor: '#F9FAFB',
              layout: {
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                fullWidth: false,
              },
            },
          },
          de: {
            name: 'LoyalistaProductPoints',
            type: 'content',
            meta: {
              uuid: '8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c',
              isGlobalTemplate: false,
            },
            content: {
              dropShadow: true,
              borders: true,
              borderColor: '#E5E7EB',
              backgroundColor: '#F9FAFB',
              layout: {
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                fullWidth: false,
              },
            },
          },
        },
      },
    ],
  },
};

export const getBlocksList = (): BlocksList => blocksList as unknown as BlocksList;

export const createDefault = (): Block => ({
  name: 'LoyalistaProductPoints',
  type: 'content',
  meta: { uuid: crypto.randomUUID() },
  content: {
    dropShadow: true,
    borders: true,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    layout: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      fullWidth: false,
    },
  },
});
