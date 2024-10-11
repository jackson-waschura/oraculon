import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { OraculonView, ORACULON_VIEW_TYPE } from './OraculonView';
import { OpenAI } from 'openai';

interface OraculonSettings {
	apiKey: string;
}

const DEFAULT_SETTINGS: OraculonSettings = {
	apiKey: ''
}

export default class OraculonPlugin extends Plugin {
	settings: OraculonSettings;
	openai: OpenAI | undefined;

	async onload() {
		await this.loadSettings();

		this.registerView(
			ORACULON_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new OraculonView(leaf)
		);

		this.addRibbonIcon('dice', 'Open Oraculon', () => {
			this.activateView();
		});

		this.addSettingTab(new OraculonSettingTab(this.app, this));

		// Initialize OpenAI API only if the API key is present
		if (this.settings.apiKey) {
			this.initializeOpenAI();
		}
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(ORACULON_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(ORACULON_VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view doesn't exist, create a new leaf in the right sidebar
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: ORACULON_VIEW_TYPE, active: true });
			}
		}

		// Reveal the leaf in the right sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async generateContent(instructions: string, pageContent: string, workflow: string) {
		if (!this.settings.apiKey) {
			return 'Please set your OpenAI API key in the plugin settings before generating content.';
		}

		try {
			const response = await this.openai?.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{ role: "system", content: `Workflow: ${workflow}\nInstructions: ${instructions}\nPage Content: ${pageContent}\n\nGenerated Content:` },
				],
				max_tokens: 1000,
			});

			return response?.choices[0].message.content?.trim();
		} catch (error) {
			console.error('Error generating content:', error);
			return 'Error generating content. Please check your API key and try again.';
		}
	}

	// Add a new method to initialize OpenAI
	public initializeOpenAI() {
		this.openai = new OpenAI({
			apiKey: this.settings.apiKey,
			project: "Oraculon",
		});
	}
}

class OraculonSettingTab extends PluginSettingTab {
	plugin: OraculonPlugin;

	constructor(app: App, plugin: OraculonPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Enter your OpenAI API key')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
					if (value) {
						this.plugin.initializeOpenAI();
					} else {
						this.plugin.openai = undefined;
					}
				}));
	}
}