import { OrderedList } from '@tiptap/extension-ordered-list';

export const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: 'decimal',
        parseHTML: (element: any) => element.style.listStyleType || 'decimal',
        renderHTML: (attributes: any) => {
          if (!attributes.listStyleType || attributes.listStyleType === 'decimal') {
            return {};
          }
          return {
            style: `list-style-type: ${attributes.listStyleType}`,
          };
        },
      },
    };
  },
});
