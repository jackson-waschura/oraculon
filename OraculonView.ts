import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import OraculonPlugin from './main';

export const ORACULON_VIEW_TYPE = 'oraculon-view';

export class OraculonView extends ItemView {
    plugin: OraculonPlugin;
    content: string = '';
    instructions: string = '';
    workflow: string = '';
    contentEl: HTMLElement;
    instructionsEl: HTMLTextAreaElement;
    workflowEl: HTMLSelectElement;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.plugin = this.app.plugins.getPlugin('oraculon') as OraculonPlugin;
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

        const instructionsContainer = container.createEl('div', { cls: 'oraculon-input-container' });
        instructionsContainer.createEl('label', { text: 'Instructions:' });
        this.instructionsEl = instructionsContainer.createEl('textarea', { cls: 'oraculon-instructions', placeholder: 'Enter your instructions here...' });

        const generateBtn = container.createEl('button', { text: 'Generate', cls: 'oraculon-generate-btn' });

        this.contentEl = container.createEl('div', { cls: 'oraculon-content' });

        // Add workflow options
        const workflows = ['Create New Page', 'Edit Existing Page', 'Find and Fix Inconsistencies', 'Generate Session Outline', 'Iterate on Session Outline'];
        workflows.forEach(workflow => {
            this.workflowEl.createEl('option', { value: workflow, text: workflow });
        });

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
                this.workflow = this.workflowEl.value;

                const generatedContent = await this.plugin.generateContent(this.instructions, this.content, this.workflow);
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
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                height: 40px;
                text-align: center;
                font-weight: 400;
            }
            .oraculon-workflow option {
                text-align: center;
            }
            .oraculon-instructions {
                height: 100px;
                resize: vertical;
                font-weight: 400;
            }
            .oraculon-generate-btn {
                display: block;
                width: 50%;
                padding: 8px;
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 auto 16px;
                font-weight: 500;
            }
            .oraculon-generate-btn:hover {
                background-color: var(--interactive-accent-hover);
            }
            .oraculon-content {
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                padding: 16px;
                min-height: 200px;
                white-space: pre-wrap;
                font-weight: 400;
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