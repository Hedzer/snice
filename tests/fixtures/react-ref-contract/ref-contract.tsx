/**
 * Compile-time contract fixture for the generated React adapter ref handle.
 *
 * This file is type-checked by tests/react-ref-contract.test.ts with
 * `tsc -p tests/fixtures/react-ref-contract/tsconfig.json`. It is
 * intentionally excluded from adapters/react/tsconfig.json so the adapter
 * build never publishes it, and from the root tsconfig so the JSX settings
 * stay local.
 *
 * Negative cases use @ts-expect-error: if the ref contract regresses to
 * `any`, the directive becomes unused and tsc fails.
 */
import { useRef } from 'react';
import { Button } from '../../../adapters/react/button';
import { Card } from '../../../adapters/react/card';
import { createReactAdapter } from '../../../adapters/react/wrapper';
import type {
  SniceAdapterRef,
  SniceComponentRef,
  SniceFormRef,
} from '../../../adapters/react/types';

// --- Form-associated adapter (Button): ref handle is SniceFormRef ---

const buttonRef = useRef<SniceFormRef>(null);

// The underlying element is reachable and fully typed through `.element`.
buttonRef.current?.element.addEventListener('click', (event) => {
  event.preventDefault();
});

// Form-associated handles expose the live form value.
const buttonValue: any = buttonRef.current?.value;
void buttonValue;

// @ts-expect-error - the handle is not the element; listeners live on `.element`
buttonRef.current?.addEventListener('click', () => {});

// @ts-expect-error - invented methods are not part of the ref contract
buttonRef.current?.reset();

// A generated wrapper accepts the correctly typed ref prop.
const button = <Button ref={buttonRef} variant="primary">Save</Button>;
void button;

// --- Plain adapter (Card): ref handle is SniceComponentRef ---

const cardRef = useRef<SniceComponentRef>(null);

cardRef.current?.element.focus();

// @ts-expect-error - non-form handles do not expose `value`
cardRef.current?.value;

// @ts-expect-error - the handle is not the element; listeners live on `.element`
cardRef.current?.addEventListener('click', () => {});

const card = <Card ref={cardRef} />;
void card;

// @ts-expect-error - the adapter ref is the typed handle, not `any`
const wrongCard = <Card ref={useRef<{ nope: string }>(null)} />;
void wrongCard;

// --- Conditional adapter ref type ---

type Assert<T extends true> = T;
type IsAssignable<A, B> = A extends B ? true : false;

type FormAdapterIsFormRef = Assert<IsAssignable<SniceAdapterRef<true>, SniceFormRef>>;
type PlainAdapterIsComponentRef = Assert<IsAssignable<SniceAdapterRef<false>, SniceComponentRef>>;
type PlainAdapterHasNoValue = Assert<IsAssignable<'value' extends keyof SniceAdapterRef<false> ? false : true, true>>;

export type RefContractChecks = [
  FormAdapterIsFormRef,
  PlainAdapterIsComponentRef,
  PlainAdapterHasNoValue,
];

// --- Hand-written adapters: the config literals drive the ref type ---

// A literal `formAssociated: true` (no explicit type arguments) must infer
// the SniceFormRef handle.
const HandForm = createReactAdapter({
  tagName: 'snice-hand-form',
  properties: ['value'],
  formAssociated: true
});
const handFormRef = useRef<SniceFormRef>(null);
const handFormValue: any = handFormRef.current?.value;
void handFormValue;
const handForm = <HandForm ref={handFormRef} />;
void handForm;

// @ts-expect-error - a plain component ref does not satisfy the form handle
const handFormWrong = <HandForm ref={cardRef} />;
void handFormWrong;

// Configured methods must be callable on the handle — and only those.
const HandMethods = createReactAdapter({
  tagName: 'snice-hand-methods',
  methods: ['focus', 'blur']
});
const handMethodsRef = useRef<SniceComponentRef & { focus: () => void; blur: () => void }>(null);
handMethodsRef.current?.focus();
const handMethods = <HandMethods ref={handMethodsRef} />;
void handMethods;

// @ts-expect-error - only genuinely exposed methods are callable on the handle
handMethodsRef.current?.reset();
