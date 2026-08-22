import { BulletList } from '@tiptap/extension-bullet-list';

export const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: 'disc',
        parseHTML: (element: any) => element.style.listStyleType || 'disc',
        renderHTML: (attributes: any) => {
          if (!attributes.listStyleType || attributes.listStyleType === 'disc') {
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
