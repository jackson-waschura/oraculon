import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import OraculonPlugin, { Workflow } from './main';

export const ORACULON_VIEW_TYPE = 'oraculon-view';

export class OraculonView extends ItemView {
    plugin: OraculonPlugin;
    content: string = '';
    instructions: string = '';
    workflow: Workflow = Workflow.NewPage;
    contentEl: HTMLElement;
    instructionsEl: HTMLTextAreaElement;
    workflowEl: HTMLSelectElement;

    constructor(leaf: WorkspaceLeaf, plugin: OraculonPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return ORACULON_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Oraculon';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('oraculon-container');

        const header = container.createEl('h2', { text: 'Oraculon', cls: 'oraculon-header' });

        const workflowContainer = container.createEl('div', { cls: 'oraculon-input-container' });
        workflowContainer.createEl('label', { text: 'Workflow:' });
        this.workflowEl = workflowContainer.createEl('select', { cls: 'oraculon-workflow' });

        // Add workflow options using the Workflow enum
        Object.values(Workflow).forEach(workflow => {
            this.workflowEl.createEl('option', { value: workflow, text: workflow });
        });

        const instructionsContainer = container.createEl('div', { cls: 'oraculon-input-container' });
        instructionsContainer.createEl('label', { text: 'Instructions:' });
        this.instructionsEl = instructionsContainer.createEl('textarea', { 
            cls: 'oraculon-instructions glass-pane', 
            placeholder: 'Enter your instructions here...' 
        });

        const generateBtn = container.createEl('button', { text: 'Generate', cls: 'oraculon-generate-btn' });

        this.contentEl = container.createEl('div', { cls: 'oraculon-content glass-pane' });

        generateBtn.addEventListener('click', this.handleGenerate.bind(this));

        this.addStyles();
    }

    async handleGenerate() {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            this.contentEl.setText('Generating...');
            try {
                const pageContent = await this.app.vault.read(activeFile);
                this.content = pageContent;
                this.instructions = this.instructionsEl.value;
                this.workflow = this.workflowEl.value as Workflow;

                const generatedContent = await this.plugin.executeWorkflow(this.workflow, this.instructions, this.content);
                if (generatedContent) {
                    this.contentEl.setText(generatedContent);
                } else {
                    throw new Error('No content generated');
                }
            } catch (error) {
                console.error('Error in handleGenerate:', error);
                this.contentEl.setText('Error: ' + (error.message || 'Failed to generate content'));
                new Notice('Failed to generate content: ' + (error.message || 'Unknown error'));
            }
        } else {
            new Notice('No active file selected');
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .oraculon-container {
                padding: 16px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                font-weight: 400;
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .oraculon-header {
                margin-bottom: 16px;
                text-align: center;
                font-weight: 600;
                background: linear-gradient(to right, #00FFFF, #8A2BE2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .oraculon-input-container {
                margin-bottom: 16px;
            }
            .oraculon-input-container label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                background: linear-gradient(to right, #00FFFF, #8A2BE2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .oraculon-workflow {
                width: 100%;
                padding: 8px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.1);
                color: var(--text-normal);
                font-weight: 400;
                transition: all 0.3s ease;
            }
            .oraculon-workflow:hover,
            .oraculon-workflow:focus {
                box-shadow: 0 0 5px rgba(138, 43, 226, 0.5);
            }
            .oraculon-workflow option {
                background: var(--background-primary);
            }
            .oraculon-generate-btn {
                display: block;
                width: 50%;
                padding: 8px;
                background: rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                cursor: pointer;
                margin: 0 auto 16px;
                font-weight: 500;
                color: var(--text-normal);
                transition: all 0.3s ease;
            }
            .oraculon-generate-btn:hover {
                box-shadow: 0 0 5px rgba(138, 43, 226, 0.5);
            }

            .glass-pane {
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                padding: 16px;
                background: rgba(0, 0, 0, 0.1);
                box-shadow: inset 4px 4px 4px rgba(0, 0, 0, 0.2);
            }

            .oraculon-instructions {
                height: 140px;
                resize: vertical;
                font-weight: 400;
                width: 100%;
                box-sizing: border-box;
            }

            .oraculon-content {
                flex-grow: 1;
                min-height: 200px;
                white-space: pre-wrap;
                font-weight: 400;
                overflow-y: auto;
                margin-bottom: 12px;
            }

            .oraculon-workflow,
            .oraculon-instructions,
            .oraculon-generate-btn {
                font-family: inherit;
            }
        `;
        document.head.appendChild(style);
    }

    async onClose() {
        // Nothing to clean up.
    }
}