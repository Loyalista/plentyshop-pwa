export type LoyalistaAccountProps = {
  name?: string;
  type?: string;
  content: LoyalistaAccountContent;
  configuration?: object;
  index?: number;
  meta: {
    uuid: string;
  };
};

export type LoyalistaAccountContent = {
  dropShadow?: boolean;
  borders?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  layout?: {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    fullWidth?: boolean;
  };
};

export type LoyalistaAccountFormProps = {
  uuid?: string;
};
