import type { BlocksList } from '~/composables/useBlocksList/types';
import type { Block } from '@plentymarkets/shop-api';

const blocksList = {
  'loyalista-account': {
    category: 'loyalista-account',
    accessControl: ['content'],
    title: 'Loyalista',
    blockName: 'LoyalistaAccount',
    variations: [
      {
        title: 'Loyalista Account',
        template: {
          en: {
            name: 'LoyalistaAccount',
            type: 'content',
            meta: {
              uuid: '3a4b5c6d-7e8f-4a5b-9c0d-1e2f3a4b5c6d',
              isGlobalTemplate: false,
            },
            content: {
              dropShadow: true,
              borders: true,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
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
            name: 'LoyalistaAccount',
            type: 'content',
            meta: {
              uuid: '4b5c6d7e-8f9a-4b5c-0d1e-2f3a4b5c6d7e',
              isGlobalTemplate: false,
            },
            content: {
              dropShadow: true,
              borders: true,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
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
  name: 'LoyalistaAccount',
  type: 'content',
  meta: { uuid: crypto.randomUUID() },
  content: {
    dropShadow: true,
    borders: true,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    layout: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      fullWidth: false,
    },
  },
});
