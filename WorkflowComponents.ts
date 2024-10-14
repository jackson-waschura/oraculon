import { Workflow } from './main';

export abstract class WorkflowComponent {
    protected container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    abstract render(): void;
    abstract getInstructions(): string;
    abstract getContent(): string;
}

export class NewPageComponent extends WorkflowComponent {
    private instructionsEl: HTMLTextAreaElement;

    render() {
        this.container.empty();
        const instructionsContainer = this.container.createEl('div', { cls: 'oraculon-input-container' });
        instructionsContainer.createEl('label', { text: 'Instructions for new page:' });
        this.instructionsEl = instructionsContainer.createEl('textarea', { 
            cls: 'oraculon-instructions glass-pane oraculon-gradient-text', 
            placeholder: 'Enter your instructions for the new page...' 
        });
    }

    getInstructions(): string {
        return this.instructionsEl.value;
    }

    getContent(): string {
        return '';
    }
}

export class EditPageComponent extends WorkflowComponent {
    private instructionsEl: HTMLTextAreaElement;
    private contentEl: HTMLTextAreaElement;

    render() {
        this.container.empty();
        const instructionsContainer = this.container.createEl('div', { cls: 'oraculon-input-container' });
        instructionsContainer.createEl('label', { text: 'Edit instructions:' });
        this.instructionsEl = instructionsContainer.createEl('textarea', { 
            cls: 'oraculon-instructions glass-pane oraculon-gradient-text', 
            placeholder: 'Enter your edit instructions...' 
        });

        const contentContainer = this.container.createEl('div', { cls: 'oraculon-input-container' });
        contentContainer.createEl('label', { text: 'Current page content:' });
        this.contentEl = contentContainer.createEl('textarea', { 
            cls: 'oraculon-content glass-pane', 
            placeholder: 'Enter the current page content...' 
        });
    }

    getInstructions(): string {
        return this.instructionsEl.value;
    }

    getContent(): string {
        return this.contentEl.value;
    }
}

// Add similar classes for other workflows...

export class WorkflowComponentFactory {
    static createComponent(workflow: Workflow, container: HTMLElement): WorkflowComponent {
        switch (workflow) {
            case Workflow.NewPage:
                return new NewPageComponent(container);
            case Workflow.EditPage:
                return new EditPageComponent(container);
            // Add cases for other workflows...
            default:
                throw new Error(`Unknown workflow: ${workflow}`);
        }
    }
}
