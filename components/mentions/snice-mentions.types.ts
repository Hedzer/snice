export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface Mention {
  id: string;
  name: string;
  startIndex: number;
  endIndex: number;
}

export interface SniceMentionsElement extends HTMLElement {
  value: string;
  users: MentionUser[];
  placeholder: string;
  readonly: boolean;
  trigger: string;

  getValue(): string;
  getPlainText(): string;
  getMentions(): Mention[];
}

export interface MentionAddDetail {
  user: MentionUser;
  value: string;
}

export interface MentionRemoveDetail {
  user: MentionUser;
  value: string;
}

export interface ValueChangeDetail {
  value: string;
  plainText: string;
  mentions: Mention[];
}

export interface SniceMentionsEventMap {
  'mention-add': CustomEvent<MentionAddDetail>;
  'mention-remove': CustomEvent<MentionRemoveDetail>;
  'value-change': CustomEvent<ValueChangeDetail>;
}
