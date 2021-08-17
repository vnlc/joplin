import { execCommand2, rootDir } from './tool-utils';

const sqlts = require('@rmp135/sql-ts').default;
const fs = require('fs-extra');

async function main() {
	// Run the CLI app once so as to generate the database file
	process.chdir(`${rootDir}/packages/app-cli`);
	await execCommand2('npm start -- version');

	const sqlTsConfig = {
		'client': 'sqlite3',
		'connection': {
			'filename': `${require('os').homedir()}/.config/joplindev/database.sqlite`,
		},
		'tableNameCasing': 'pascal',
		'singularTableNames': true,
		'useNullAsDefault': true, // To disable warning "sqlite does not support inserting default values"
		'excludedTables': [
			'main.notes_fts',
			'main.notes_fts_segments',
			'main.notes_fts_segdir',
			'main.notes_fts_docsize',
			'main.notes_fts_stat',
			'main.master_keys',
		],
	};

	const definitions = await sqlts.toObject(sqlTsConfig);

	definitions.tables = definitions.tables.map((t: any) => {
		t.columns.push({
			nullable: false,
			name: 'type_',
			type: 'int',
			optional: true,
			isEnum: false,
			propertyName: 'type_',
			propertyType: 'number',
		});

		return t;
	});

	const tsString = sqlts.fromObject(definitions, sqlTsConfig)
		.replace(/": /g, '"?: ');
	const header = `// AUTO-GENERATED BY ${__filename.substr(rootDir.length + 1)}`;

	const targetFile = `${rootDir}/packages/lib/services/database/types.ts`;
	console.info(`Writing type definitions to ${targetFile}...`);

	const existingContent = (await fs.pathExists(targetFile)) ? await fs.readFile(targetFile, 'utf8') : '';
	const splitted = existingContent.split('// AUTO-GENERATED BY');
	const staticContent = splitted[0];

	await fs.writeFile(targetFile, `${staticContent}\n\n${header}\n\n${tsString}`, 'utf8');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
