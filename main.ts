import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { OraculonView, ORACULON_VIEW_TYPE } from './OraculonView';
import { OpenAI } from 'openai';

interface OraculonSettings {
	apiKey: string;
	openaiOrganization: string;
	projectId: string;
}

const DEFAULT_SETTINGS: OraculonSettings = {
	apiKey: '',
	openaiOrganization: '',
	projectId: ''
}

export default class OraculonPlugin extends Plugin {
	settings: OraculonSettings;
	openai: OpenAI | undefined;
	statusLabel: HTMLElement | undefined;
	lastError: string | undefined;

	async onload() {
		await this.loadSettings();

		// Add this line to load the CSS
		this.loadStyles();

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
		if (!this.openai) {
			if (!this.settings.apiKey || !this.settings.openaiOrganization) {
				throw new Error('Please set both your OpenAI API key and Organization ID in the plugin settings before generating content.');
			}
			try {
				await this.initializeOpenAI();
			} catch (error) {
				throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
			}
		}

		try {
			const response = await this.openai?.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{ role: "system", content: `Workflow: ${workflow}\nInstructions: ${instructions}\nPage Content: ${pageContent}\n\nGenerated Content:` },
				],
				max_tokens: 100,
			});
			
			const generatedContent = response?.choices[0].message.content?.trim();

			if (!generatedContent) {
				throw new Error('No content generated from the API');
			}
			return generatedContent;
		} catch (error) {
			console.error('Error generating content:', error);
			if (error.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				throw new Error(`API Error: ${error.response.status} - ${error.response.data.error.message}`);
			} else if (error.request) {
				// The request was made but no response was received
				throw new Error('No response received from the API. Please check your internet connection.');
			} else {
				// Something happened in setting up the request that triggered an Error
				throw new Error('Error setting up the request: ' + error.message);
			}
		}
	}

	// Add a new method to initialize OpenAI
	public async initializeOpenAI(): Promise<boolean> {
		if (!this.settings.apiKey || !this.settings.openaiOrganization || !this.settings.projectId) {
			return false;
		}

		try {
			this.openai = new OpenAI({
				apiKey: this.settings.apiKey,
				organization: this.settings.openaiOrganization,
				project: this.settings.projectId,
				dangerouslyAllowBrowser: true,
			});
			
			// Test the connection
			await this.openai.models.list();
			return true;
		} catch (error) {
			console.error('Failed to initialize OpenAI:', error);
			this.openai = undefined;
			// Store the error message
			this.lastError = error.message || 'Unknown error occurred';
			return false;
		}
	}

	public updateStatusLabel() {
		if (this.statusLabel) {
			if (!this.settings.apiKey || !this.settings.openaiOrganization || !this.settings.projectId) {
				this.statusLabel.textContent = 'Status: API Key, Organization ID, and Project ID Required';
				this.statusLabel.className = 'oraculon-status-error';
			} else if (this.openai) {
				this.statusLabel.textContent = 'Status: Connected';
				this.statusLabel.className = 'oraculon-status-connected';
			} else if (this.lastError) {
				this.statusLabel.textContent = `Status: Connection Failed - ${this.lastError}`;
				this.statusLabel.className = 'oraculon-status-error';
			} else {
				this.statusLabel.textContent = 'Status: Connecting...';
				this.statusLabel.className = 'oraculon-status-connecting';
			}
		}
	}

	// Add this new method to clear the last error
	public clearLastError() {
		this.lastError = undefined;
	}

	// Add this new method
	loadStyles() {
		const styleElement = document.createElement('style');
		styleElement.id = 'oraculon-styles';
		document.head.appendChild(styleElement);
		styleElement.textContent = `
			.oraculon-status-container {
				margin-bottom: 20px;
				font-size: 1.2em;
				font-weight: bold;
			}
			.oraculon-status-error {
				background: linear-gradient(to right, #FF0000, #FFA500);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.oraculon-status-connecting {
				background: linear-gradient(to right, #FFA500, #8A2BE2);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.oraculon-status-connected {
				background: linear-gradient(to right, #00FFFF, #8A2BE2);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
		`;
	}
}

class OraculonSettingTab extends PluginSettingTab {
	plugin: OraculonPlugin;
	statusLabel: HTMLElement;

	constructor(app: App, plugin: OraculonPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const statusContainer = containerEl.createDiv('status-container oraculon-status-container');
		this.statusLabel = statusContainer.createEl('span', { text: 'Status: ' });
		this.plugin.statusLabel = this.statusLabel;
		this.plugin.updateStatusLabel();

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Enter your OpenAI API key')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
					this.plugin.clearLastError(); // Clear any previous errors
					this.plugin.updateStatusLabel();
					if (value && this.plugin.settings.openaiOrganization) {
						this.plugin.updateStatusLabel(); // Set to "Connecting..." state
						const success = await this.plugin.initializeOpenAI();
						this.plugin.updateStatusLabel();
					} else {
						this.plugin.openai = undefined;
						this.plugin.updateStatusLabel();
					}
				})
			)

		new Setting(containerEl)
			.setName('OpenAI Organization ID')
			.setDesc('Enter your OpenAI Organization ID')
			.addText(text => text
				.setPlaceholder('Enter your Organization ID')
				.setValue(this.plugin.settings.openaiOrganization)
				.onChange(async (value) => {
					this.plugin.settings.openaiOrganization = value;
					await this.plugin.saveSettings();
					this.plugin.clearLastError(); // Clear any previous errors
					this.plugin.updateStatusLabel();
					if (value && this.plugin.settings.apiKey) {
						this.plugin.updateStatusLabel(); // Set to "Connecting..." state
						const success = await this.plugin.initializeOpenAI();
						this.plugin.updateStatusLabel();
					} else {
						this.plugin.openai = undefined;
						this.plugin.updateStatusLabel();
					}
				})
			)

		new Setting(containerEl)
			.setName('OpenAI Project ID')
			.setDesc('Enter your OpenAI Project ID')
			.addText(text => text
				.setPlaceholder('Enter your Project ID')
				.setValue(this.plugin.settings.projectId)
				.onChange(async (value) => {
					this.plugin.settings.projectId = value;
					await this.plugin.saveSettings();
					this.plugin.clearLastError(); // Clear any previous errors
					this.plugin.updateStatusLabel();
					if (value && this.plugin.settings.apiKey && this.plugin.settings.openaiOrganization) {
						this.plugin.updateStatusLabel(); // Set to "Connecting..." state
						const success = await this.plugin.initializeOpenAI();
						this.plugin.updateStatusLabel();
					} else {
						this.plugin.openai = undefined;
						this.plugin.updateStatusLabel();
					}
				})
			)
	}
}