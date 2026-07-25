import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-layout-auth-split.css?inline';

/**
 * Split authentication page: the form on one side, brand imagery on the other.
 *
 * The brand panel is decorative. Below the breakpoint it steps aside and the
 * form takes the full width, which is what sign-in pages do everywhere.
 */
@element('snice-layout-auth-split')
export class SniceLayoutAuthSplit extends HTMLElement {
  /** Which side the brand panel sits on. */
  @property({ attribute: 'panel-position' })
  panelPosition: 'start' | 'end' = 'end';

  /** Size to the parent element instead of filling the screen. */
  @property({ type: Boolean })
  contained = false;

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <section class="form-side" part="form">
          <div class="form-inner">
            <div class="brand" part="brand">
              <slot name="brand"></slot>
            </div>

            <div class="form-body" part="page">
              <slot name="page"></slot>
            </div>

            <div class="footer" part="footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </section>

        <aside class="panel" part="panel" aria-hidden="true">
          <slot name="panel"></slot>
        </aside>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}
