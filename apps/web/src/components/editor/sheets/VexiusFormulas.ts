import { FunctionPlugin, FunctionArgumentType } from 'hyperformula';

export class VexiusCustomFormulas extends FunctionPlugin {
  // 1. =FORMAT_IDR(value)
  // Formats a number to Indonesian Rupiah currency string
  formatIdr(ast: any, state: any) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('FORMAT_IDR'),
      (value: number) => {
        if (typeof value !== 'number') return '#VALUE!';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(value);
      }
    );
  }

  // Define translations and parameters for our custom functions
  static get translations() {
    return {
      enGB: {
        FORMAT_IDR: 'FORMAT_IDR',
      },
    };
  }
}

// Register the custom function plugin and bind it to translations
VexiusCustomFormulas.implementedFunctions = {
  FORMAT_IDR: {
    method: 'formatIdr',
    parameters: [{ argumentType: FunctionArgumentType.NUMBER }]
  },
};
