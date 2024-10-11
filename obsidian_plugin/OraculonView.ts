import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import OraculonPlugin from './main';

export const ORACULON_VIEW_TYPE = 'oraculon-view';

export class OraculonView extends ItemView {
    plugin: OraculonPlugin;
    content: string = '';
    instructions: string = '';
    workflow: string = '';

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

        const contentEl = container.createEl('div', { cls: 'oraculon-content' });
        const instructionsEl = container.createEl('textarea', { cls: 'oraculon-instructions' });
        const workflowEl = container.createEl('select', { cls: 'oraculon-workflow' });
        const generateBtn = container.createEl('button', { text: 'Generate' });

        // Add workflow options
        const workflows = ['Create New Page', 'Edit Existing Page', 'Find and Fix Inconsistencies', 'Generate Session Outline', 'Iterate on Session Outline'];
        workflows.forEach(workflow => {
            const option = workflowEl.createEl('option', { value: workflow, text: workflow });
        });

        generateBtn.addEventListener('click', async () => {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                const pageContent = await this.app.vault.read(activeFile);
                this.content = pageContent;
                this.instructions = instructionsEl.value;
                this.workflow = workflowEl.value;

                const generatedContent = await this.plugin.generateContent(this.instructions, this.content, this.workflow);
                contentEl.setText(generatedContent);
            } else {
                new Notice('No active file selected');
            }
        });
    }

    async onClose() {
        // Nothing to clean up.
    }
}