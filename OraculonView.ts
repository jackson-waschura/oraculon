import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import OraculonPlugin, { Workflow } from './main';
import { WorkflowComponent, WorkflowComponentFactory } from './WorkflowComponents';

export const ORACULON_VIEW_TYPE = 'oraculon-view';

export class OraculonView extends ItemView {
    plugin: OraculonPlugin;
    workflowEl: HTMLSelectElement;
    currentWorkflow: WorkflowComponent;
    contentEl: HTMLElement;

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

    getIcon() {
        return 'sparkle';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('oraculon-container');

        const header = container.createEl('h2', { text: 'Oraculon', cls: 'oraculon-header oraculon-gradient-text' });

        const workflowContainer = container.createEl('div', { cls: 'oraculon-workflow-container' });
        const workflowLabel = workflowContainer.createEl('label', { text: 'Workflow:', cls: 'oraculon-workflow-label oraculon-gradient-text' });
        this.workflowEl = workflowContainer.createEl('select', { cls: 'oraculon-workflow' });

        Object.values(Workflow).forEach(workflow => {
            this.workflowEl.createEl('option', { value: workflow, text: workflow });
        });

        this.workflowEl.addEventListener('change', this.handleWorkflowChange.bind(this));

        const componentContainer = container.createEl('div', { cls: 'oraculon-component-container' });
        this.currentWorkflow = WorkflowComponentFactory.createComponent(Workflow.NewPage, componentContainer);
        this.currentWorkflow.render();

        const generateBtn = container.createEl('button', { text: 'Generate', cls: 'oraculon-generate-btn' });
        generateBtn.addEventListener('click', this.handleGenerate.bind(this));

        this.contentEl = container.createEl('div', { cls: 'oraculon-content glass-pane' });

        this.addStyles();
    }

    handleWorkflowChange() {
        const selectedWorkflow = this.workflowEl.value as Workflow;
        const componentContainer = this.containerEl.querySelector('.oraculon-component-container') as HTMLElement;
        this.currentWorkflow = WorkflowComponentFactory.createComponent(selectedWorkflow, componentContainer);
        this.currentWorkflow.render();
    }

    async handleGenerate() {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            this.contentEl.setText('Generating...');
            try {
                const workflow = this.workflowEl.value as Workflow;
                const instructions = this.currentWorkflow.getInstructions();
                const content = this.currentWorkflow.getContent();

                const generatedContent = await this.plugin.executeWorkflow(workflow, instructions, content);
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
                background: linear-gradient(to right, #00FFFF, #8A2BE2);
                background-clip: text;
            }

            .oraculon-gradient-text {
                background: inherit;
                background-clip: text;
                color: transparent;
            }

            .oraculon-header {
                margin-bottom: 16px;
                text-align: center;
                font-weight: 600;
            }

            .oraculon-workflow-container {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
            }

            .oraculon-workflow-label {
                flex-shrink: 0;
                margin-right: 10px;
                font-weight: 500;
            }

            .oraculon-workflow {
                flex-grow: 1;
                padding: 8px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                background: rgba(0, 0, 0, 0.1);
                color: var(--text-normal);
                font-weight: 400;
                transition: all 0.3s ease;
                line-height: 1.2;
                height: auto;
            }

            .oraculon-workflow:hover,
            .oraculon-workflow:focus {
                box-shadow: 0 0 5px rgba(69, 139, 226, 0.5);
            }

            .oraculon-workflow option {
                background: var(--background-primary);
            }

            .oraculon-generate-btn {
                display: block;
                width: 50%;
                padding: 12px;
                background: rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 12px;
                cursor: pointer;
                margin: 0 auto 16px;
                font-weight: 500;
                color: var(--text-normal);
                transition: all 0.3s ease;
                line-height: 1.2;
                height: auto;
            }

            .oraculon-generate-btn:hover {
                box-shadow: 0 0 5px rgba(69, 139, 226, 0.5);
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
