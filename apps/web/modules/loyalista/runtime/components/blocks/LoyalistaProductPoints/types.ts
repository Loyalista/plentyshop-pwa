export type LoyalistaProductPointsProps = {
  name?: string;
  type?: string;
  content: LoyalistaProductPointsContent;
  configuration?: object;
  index?: number;
  meta: {
    uuid: string;
  };
};

export type LoyalistaProductPointsContent = {
  text?: {
    title?: string;
  };
  layout?: {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    fullWidth?: boolean;
  };
};

export type LoyalistaProductPointsFormProps = {
  uuid?: string;
};
