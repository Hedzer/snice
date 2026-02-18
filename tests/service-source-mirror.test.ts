import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, dispatch, render, styles, html, css } from '../src/index';
import '../components/modal/snice-modal';
import '../components/button/snice-button';

type SourceType = 'docker' | 'devcontainer' | 'remote';
type SourceStatus = 'running' | 'stopped' | 'connecting';
type LaunchPhase = 'stopped' | 'idle' | 'running' | 'starting';

interface RemoteDev {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  services: string[];
}

/**
 * Exact mirror of service-source component to reproduce parsing issues
 */
describe('service-source component exact mirror', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should parse and render the exact service-source template', async () => {
    @element('service-source-test')
    class ServiceSourceComponent extends HTMLElement {
      @property({})
      sourceId = '';

      @property({})
      serviceKey = '';

      @property({})
      serviceName = '';

      @property({})
      sourceType: SourceType = 'docker';

      @property({})
      host = 'localhost';

      @property({ type: Number })
      port: number | null = null;

      @property({})
      status: SourceStatus = 'stopped';

      @property({ type: Boolean })
      hasDevcontainer = false;

      @property({ type: Boolean })
      selected = false;

      @property({})
      phase: LaunchPhase = 'stopped';

      @property({})
      branch = '';

      @property({ type: Boolean })
      remoteModalOpen = false;

      @property({ type: Boolean })
      loadingRemotes = false;

      @property({})
      remotes: RemoteDev[] = [];

      @property({})
      selectedRemoteId = '';

      @property({ type: Boolean })
      switching = false;

      private handleSourceSelect(type: SourceType) {
        if (this.switching) return;
        if (type === 'remote') {
          this.openRemoteModal();
        } else if (type === 'devcontainer' && this.sourceType === 'devcontainer') {
          this.dispatchDevcontainerOpen();
        } else {
          this.switching = true;
          this.dispatchSourceSwitch(type);
          setTimeout(() => { this.switching = false; }, 3000);
        }
      }

      private async openRemoteModal() {
        this.remoteModalOpen = true;
        this.loadingRemotes = true;

        try {
          // Mock the API call
          this.remotes = [
            { id: '1', name: 'Dev 1', email: 'dev1@test.com', avatarUrl: '', services: [] },
            { id: '2', name: 'Dev 2', email: 'dev2@test.com', avatarUrl: '', services: [] },
          ];
        } catch (e) {
          console.error('Failed to load remotes:', e);
          this.remotes = [];
        } finally {
          this.loadingRemotes = false;
        }
      }

      private closeRemoteModal() {
        this.remoteModalOpen = false;
        this.selectedRemoteId = '';
      }

      private selectRemote(remote: RemoteDev) {
        this.selectedRemoteId = remote.id;
      }

      private async confirmRemoteSelection() {
        if (this.selectedRemoteId) {
          const remote = this.remotes.find(r => r.id === this.selectedRemoteId);
          if (remote) {
            this.dispatchSourceSwitch('remote', remote);
          }
        }
        this.closeRemoteModal();
      }

      private handlePlay() {
        this.dispatchSourceStart();
      }

      private handleStop() {
        this.dispatchSourceStop();
      }

      @dispatch('source-start')
      private dispatchSourceStart() {
        return { id: this.sourceId, serviceKey: this.serviceKey };
      }

      @dispatch('source-stop')
      private dispatchSourceStop() {
        return { id: this.sourceId, serviceKey: this.serviceKey };
      }

      @dispatch('source-switch')
      private dispatchSourceSwitch(newType: SourceType, remote?: RemoteDev) {
        return { id: this.sourceId, serviceKey: this.serviceKey, newType, remote };
      }

      @dispatch('devcontainer-open')
      private dispatchDevcontainerOpen() {
        return { id: this.sourceId, serviceKey: this.serviceKey };
      }

      @dispatch('source-select')
      private dispatchSourceSelect() {
        return { id: this.sourceId, serviceKey: this.serviceKey, serviceName: this.serviceName };
      }

      private handleRowClick() {
        this.dispatchSourceSelect();
      }

      private extractJiraTicket(branch: string): string | null {
        const match = branch.match(/([A-Z]+-\d+)/);
        return match ? match[1] : null;
      }

      private openJiraTicket(ticket: string, e: Event) {
        e.preventDefault();
        e.stopPropagation();
        // Mock - would open URL
      }

      private copyEndpoint(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        if (this.port) {
          navigator.clipboard.writeText(`${this.host}:${this.port}`);
          const btn = e.currentTarget as HTMLElement;
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 500);
        }
      }

      @render()
      template() {
        const isRunning = this.status === 'running';
        const isConnecting = this.status === 'connecting';
        const isStopped = this.status === 'stopped';
        const rowClasses = ['service-row', this.status, this.selected ? 'selected' : ''].filter(Boolean).join(' ');
        const showPhases = this.sourceType === 'docker' && (isConnecting || (this.phase !== 'stopped' && this.phase !== 'idle' && this.phase !== 'running'));
        const dockerBtnClasses = ['source-btn', this.sourceType === 'docker' ? 'active' : ''].filter(Boolean).join(' ');
        const devcontainerBtnClasses = ['source-btn', this.sourceType === 'devcontainer' ? 'active' : ''].filter(Boolean).join(' ');
        const devcontainerTitle = this.sourceType === 'devcontainer' ? 'Open VS Code' : 'VS Code Devcontainer';
        const remoteBtnClasses = ['source-btn', this.sourceType === 'remote' ? 'active' : ''].filter(Boolean).join(' ');

        return html/*html*/`
          <div class="${rowClasses}" @click=${() => this.handleRowClick()}>
            <div class="service-info">
              <span class="status-dot ${this.status}"></span>
              <div class="service-details">
                <div class="service-header">
                  <span class="service-name">${this.serviceName}</span>
                  <if ${this.branch}>
                    <span class="git-branch" @click=${(e: Event) => e.stopPropagation()}><span class="branch-icon"></span>${(() => {
                        const ticket = this.extractJiraTicket(this.branch);
                        if (ticket) {
                          const prefix = this.branch.substring(0, this.branch.indexOf(ticket));
                          const suffix = this.branch.substring(this.branch.indexOf(ticket) + ticket.length);
                          return html`${prefix}<span class="jira-link" @click=${(e: Event) => this.openJiraTicket(ticket, e)}>${ticket}</span>${suffix}`;
                        }
                        return this.branch;
                      })()}</span>
                  </if>
                </div>
                <if ${showPhases}>
                  <div class="phase-indicator">${this.phase}</div>
                </if>
                <if ${!showPhases && this.port}>
                  <div class="service-endpoint-row">
                    <span class="service-endpoint">${this.host}:${this.port}</span>
                    <button class="endpoint-copy-btn" title="Copy" @click=${(e: Event) => this.copyEndpoint(e)}>
                      <span class="material-symbols-rounded">content_copy</span>
                    </button>
                  </div>
                </if>
              </div>
            </div>

            <div class="service-controls">
              <if ${this.serviceKey !== 'nat-proxy'}>
                <div class="source-toggle" @click=${(e: Event) => e.stopPropagation()}>
                  <button
                    class="${dockerBtnClasses}"
                    title="Docker Container"
                    ?disabled=${this.switching}
                    @click=${() => this.handleSourceSelect('docker')}>
                    <img src="/src/assets/images/docker.svg" alt="Docker" class="source-icon" />
                  </button>
                  <if ${this.hasDevcontainer}>
                    <button
                      class="${devcontainerBtnClasses}"
                      title="${devcontainerTitle}"
                      ?disabled=${this.switching}
                      @click=${() => this.handleSourceSelect('devcontainer')}>
                      <img src="/src/assets/images/vscode.svg" alt="VS Code" class="source-icon" />
                    </button>
                  </if>
                  <button
                    class="${remoteBtnClasses}"
                    title="Remote Developer"
                    ?disabled=${this.switching}
                    @click=${() => this.handleSourceSelect('remote')}>
                    <span class="material-symbols-rounded">group</span>
                  </button>
                </div>
              </if>

              <if ${this.serviceKey !== 'nat-proxy'}>
                <div class="playback-controls" @click=${(e: Event) => e.stopPropagation()}>
                  <button
                    class="control-btn play"
                    title="Start"
                    ?disabled=${isRunning || isConnecting}
                    @click=${() => this.handlePlay()}>
                    <span class="material-symbols-rounded">play_arrow</span>
                  </button>
                  <button
                    class="control-btn stop"
                    title="Stop"
                    ?disabled=${isStopped}
                    @click=${() => this.handleStop()}>
                    <span class="material-symbols-rounded">stop</span>
                  </button>
                </div>
              </if>
            </div>
          </div>

          <snice-modal
            ?open=${this.remoteModalOpen}
            label="Select Remote Developer"
            size="small"
            @modal-close=${() => this.closeRemoteModal()}
            >
            <span slot="header">Select Remote Developer</span>

            <div class="remote-content">
              <if ${this.loadingRemotes}>
                <div class="loading-remotes">
                  <span class="spinner"></span>
                  <span>Searching for developers...</span>
                </div>
              </if>
              <if ${!this.loadingRemotes && this.remotes.length === 0}>
                <div class="empty-remotes">
                  <p>No developers found running this service.</p>
                </div>
              </if>
              <if ${!this.loadingRemotes && this.remotes.length > 0}>
                <div class="remote-list">
                  ${this.remotes.map(remote => html/*html*/`
                    <div
                      class="remote-item ${this.selectedRemoteId === remote.id ? 'selected' : ''}"
                      @click=${() => this.selectRemote(remote)}>
                      <div class="remote-info">
                        <span class="remote-name">${remote.name}</span>
                        <span class="remote-host">${remote.email}</span>
                      </div>
                      <div class="remote-status">
                        <span class="remote-status-dot"></span>
                        <span>Online</span>
                      </div>
                    </div>
                  `)}
                </div>
              </if>
            </div>

            <div slot="footer">
              <snice-button variant="ghost" @click=${() => this.closeRemoteModal()}>
                Cancel
              </snice-button>
              <snice-button
                variant="primary"
                ?disabled=${!this.selectedRemoteId}
                @click=${() => this.confirmRemoteSelection()}>
                Connect
              </snice-button>
            </div>
          </snice-modal>
        `;
      }

      @styles()
      componentStyles() {
        return css`
          .service-row { display: flex; }
          .selected { background: #eee; }
        `;
      }
    }

    const el = document.createElement('service-source-test') as InstanceType<typeof ServiceSourceComponent>;
    el.sourceId = 'src-1';
    el.serviceKey = 'my-service';
    el.serviceName = 'My Service';
    el.port = 8080;
    container.appendChild(el);
    await el.ready;

    // Verify basic render
    const row = el.shadowRoot?.querySelector('.service-row');
    expect(row).toBeTruthy();
    expect(row?.className).toContain('stopped');
  });
});
