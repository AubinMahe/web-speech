// imports Systèmes
import * as
   FS
from 'node:fs';
import * as
   CP
from 'node:child_process';
import {
   createServer,
   IncomingMessage,
   ServerResponse
} from 'node:http';
import {
   lookup
} from 'mime-types';
import * as
   PATH
from 'node:path';

// imports Applicatifs
import {
   AMuleCommand
} from './AMuleCommand';
import {
   AmuleDaemonRestart
} from './AmuleDaemonRestart';
import {
   AmuleDaemonStop
} from './AmuleDaemonStop';
import {
   Cancel
} from './Cancel';
import {
   Cfg
} from './Cfg';
import {
   ConnectTo
} from './ConnectTo';
import {
   CreateSeries
} from './CreateSeries';
import {
   CreateSharedLinks
} from './CreateSharedLinks';
import {
   Download
} from './Download';
import {
   GetFilesContext
} from './GetFilesContext';
import {
   GetEpisodes
} from './GetEpisodes';
import {
   HTTP_STATUS
} from './HTTP_STATUS';
import {
   IExecutable
} from './IExecutable';
import {
   MoveFilesToNas
} from './MoveFilesToNas'
import {
   MoveFilesToTrash
} from './MoveFilesToTrash'
import {
   OpenExplorer
} from './OpenExplorer'
import {
   Preview
} from './Preview';
import {
   Progress
} from './Progress';
import {
   ReloadShared
} from './ReloadShared';
import {
   RenameDownloadedFile
} from './RenameDownloadedFile';
import {
   RenamePartfile
} from './RenamePartfile';
import {
   Reset
} from './Reset';
import {
   Results
} from './Results';
import {
   Search
} from './Search';
import {
   ShowDL
} from './ShowDL';
import {
   ShowLog
} from './ShowLog';
import {
   ShowServers
} from './ShowServers';
import {
   ShowUL
} from './ShowUL';
import {
   ShutdownNode
} from './ShutdownNode';
import {
   Status
} from './Status';
import {
   getContext,
   trace
} from './Trace';

// Imports partagés entre client et serveur (Back/Front)
import {
   Services
} from '../Types/Services';

if( ! FS.existsSync( Cfg.NAS_000_A_VOIR )) {
   CP.exec( `mount ${PATH.dirname( Cfg.NAS_000_A_VOIR )}`,( ex, out, err ) => {
      if( ex ) {
         console.error( ex );
         console.error( out );
         console.error( err );
         process.exit( ex.code );
      }
   });
}

const amuleDaemonRestart = new AmuleDaemonRestart();
const amuleDaemonStop = new AmuleDaemonStop();
const connectTo = new ConnectTo();
const createSeries = new CreateSeries();
const createSharedLinks = new CreateSharedLinks();
const getFilesContext = new GetFilesContext();
const getEpisodes = new GetEpisodes();
const moveFilesToNAS = new MoveFilesToNas( getFilesContext );
const moveFilesToTrash = new MoveFilesToTrash( getFilesContext );
const openDownloadInExplorer = new OpenExplorer( Cfg.AMULE_DOWNLOAD_DIR );
const preview = new Preview();
const searchAMuleCmd = new AMuleCommand();
const search   = new Search  ( searchAMuleCmd );
const progress = new Progress( searchAMuleCmd );
const results  = new Results ( searchAMuleCmd );
const download = new Download( searchAMuleCmd );
const reloadShared = new ReloadShared();
const renameDownloadedFile = new RenameDownloadedFile( getFilesContext );
const reset = new Reset();
const showDL = new ShowDL();
const cancel = new Cancel( showDL );
const renamePartfile = new RenamePartfile( showDL );
const showLog = new ShowLog();
const showUL = new ShowUL();
const shutdownNode = new ShutdownNode();
const statusGet = new Status();
const showServers = new ShowServers( statusGet );
const commands = new Map<string, IExecutable>([
   [ Services.AMULED_RESTART                          , amuleDaemonRestart     ],
   [ Services.AMULED_STOP                             , amuleDaemonStop        ],
   [ Services.CANCEL                                  , cancel                 ],
   [ Services.CONNECT_TO                              , connectTo              ],
   [ Services.CREATE_SERIES                           , createSeries           ],
   [ Services.CREATE_SHARED_LINKS                     , createSharedLinks      ],
   [ Services.DOWNLOAD                                , download               ],
   [ Services.GET_FILES_CONTEXT                       , getFilesContext        ],
   [ Services.GET_EPISODES                            , getEpisodes            ],
   [ Services.MOVE_FILES_TO_NAS                       , moveFilesToNAS         ],
   [ Services.MOVE_SELECTED_FILES_TO_TRASH            , moveFilesToTrash       ],
   [ Services.OPEN_DOWNLOAD_FOLDER_IN_EXPLORER        , openDownloadInExplorer ],
   [ Services.PREVIEW                                 , preview                ],
   [ Services.PROGRESS                                , progress               ],
   [ Services.RELOAD_SHARED                           , reloadShared           ],
   [ Services.RENAME_DOWNLOADED_FILE                  , renameDownloadedFile   ],
   [ Services.RENAME_PARTFILE                         , renamePartfile         ],
   [ Services.RESET                                   , reset                  ],
   [ Services.RESULTS                                 , results                ],
   [ Services.SEARCH                                  , search                 ],
   [ Services.SHOW_DOWNLOAD                           , showDL                 ],
   [ Services.SHOW_LOG                                , showLog                ],
   [ Services.SHOW_SERVERS                            , showServers            ],
   [ Services.SHOW_UPLOAD                             , showUL                 ],
   [ Services.SHUTDOWN_NODE                           , shutdownNode           ],
   [ Services.STATUS                                  , statusGet              ],
]);

function servePage( request: IncomingMessage, response: ServerResponse<IncomingMessage> ) {
   const url = request.url;
   trace( __filename, `servePage: ${url}` );
   let filepath = url;
   if( url === '/' ) {
      filepath = Cfg.PAGES_DIR + '/index.html';
   }
   else if( url === '/favicon.ico' ) {
      filepath = Cfg.FAVICON_PATH;
   }
   else if( url.startsWith( '/node_modules/' )) {
      filepath = '.' + url;
   }
   else {
      filepath = Cfg.PAGES_DIR + url;
      if( url.lastIndexOf('.') < 2 ) {
         filepath += '.js';
      }
   }
   let ct: string | false = lookup( filepath );
   trace( __filename, `Content-Type of '${filepath} is ${ct}'.`);
   if( ct ) {
      let options = {};
      if( ct.indexOf( 'text' ) > -1 ) {
         ct += '; charset=utf-8';
         options = { encoding: 'utf-8' };
      }
      trace( __filename, `Reading '${filepath}'...`);
      FS.promises
      .readFile( filepath, options )
      .then( data => {
         trace( __filename, `response.setHeader( 'Content-Type', '${ct}' )`);
         response.setHeader( 'Content-Type', '' + ct );
         response.statusCode = HTTP_STATUS.OK;
         response.end( data );
      })
      .catch( err => {
         console.error( `${new Date()}: ERROR: '${url}' not found, filepath: '${filepath}'` );
         console.error( `${new Date()}: ${err}` );
         response.statusCode = HTTP_STATUS.NOT_FOUND;
         response.end();
      });
   }
   else {
      response.statusCode = HTTP_STATUS.NOT_FOUND;
      console.error( `${new Date()}: ERROR: No content-type for '${filepath}'!` );
   }
}

function executeCommand( cmd: IExecutable, request: IncomingMessage, response: ServerResponse<IncomingMessage> ): void {
   trace( __filename, `executeCommand: ${request.url}` );
   response.statusCode = HTTP_STATUS.OK;
   const ct = lookup( 'json' ) + ';charset=UTF-8';
   response.setHeader( 'Content-Type', ct );
   let data = '';
   request.on( 'data', chunk => data += chunk );
   request.on( 'end' , async () => {
      cmd.execute(( data.length > 2 ) ? JSON.parse( data ) : undefined )
         .then( result => response.end( result.json ))
         .catch( e => console.error( `${new Date()}: ${getContext()}: ${e}` ));
   });
   request.on( 'error', e => console.error( `${new Date()}: ${getContext()}: ${e}` ));
}

function requestListener( request: IncomingMessage, response: ServerResponse ) {
   shutdownNode.reset();
   const command = commands.get( request.url.toLowerCase());
   if( command !== undefined ) {
      executeCommand( command, request, response );
   }
   else {
      servePage( request, response );
   }
}

const server = createServer( requestListener );
server.listen( Cfg.PORT, Cfg.HOST, () => {
   console.log( `Server is running on http://${Cfg.HOST}:${Cfg.PORT}` );
});

process.on( 'SIGTERM', function() {
   console.log( 'Exiting HTTP server and NodeJS, good bye!' );
   setTimeout(() => process.exit( 0 ), 500 );
});
process.on( 'SIGINT', function() {
   console.log( 'Exiting HTTP server and NodeJS, good bye!' );
   process.exit( 0 );
});
process.on( 'unhandledRejection', error => {
   console.error( `${new Date()}: unhandledRejection: ${error}` );
});
