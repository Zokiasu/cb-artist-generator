"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ytmusic_api_1 = __importDefault(require("ytmusic-api"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const db = require("../javascript/db");
const ytm = new ytmusic_api_1.default();
let artistList = [];
let releaseList = [];
// console.log(process.argv)
// process.argv.shift()  // skip node.exe
// process.argv.shift()  // skip name of js file
// let entry = process.argv.join(" ")
// ytm.initialize().then(async () => {
//   artistList = await getArtistFromFirebase()
//   releaseList = await getReleasesFromFirebase()
//   // await verifyArtist('UC9oomNHPNLrh819sxCgcYTA')
//   if(entry) {
//     entry = entry.replace(/[$^]/g, "")
//     console.log('Entry', entry)
//     newArtist(entry)
//   } else {
//     for (let index = artistList.length-1; index >= 0; index--) {
//       if(artistList[index].idYoutubeMusic) {
//         setTimeout(async () => {
//           await verifyArtist(artistList[index].idYoutubeMusic)
//         }, index * 1000);  // attendre 1 seconde avant chaque itération
//       }
//     }
//   }
// });
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question('What is the name of the artist? ', (entry) => {
    console.log(`You entered: ${entry}`);
    // code restant de votre script ici
    ytm.initialize().then(() => __awaiter(void 0, void 0, void 0, function* () {
        artistList = yield getArtistFromFirebase();
        releaseList = yield getReleasesFromFirebase();
        // await verifyArtist('UC9oomNHPNLrh819sxCgcYTA')
        if (entry) {
            entry = entry.replace(/[$^]/g, "");
            console.log('Entry', entry);
            newArtist(entry);
        }
        else {
            for (let index = artistList.length - 1; index >= 0; index--) {
                if (artistList[index].idYoutubeMusic) {
                    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                        yield verifyArtist(artistList[index].idYoutubeMusic);
                    }), index * 1000); // attendre 1 seconde avant chaque itération
                }
            }
        }
    }));
    rl.close();
});
// Main function
function artistTopAlbums(artist, artistId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield artist.topAlbums.forEach((album) => __awaiter(this, void 0, void 0, function* () {
            yield getAlbum(album.albumId).then((alb) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (alb.songs[0] === undefined) {
                    // console.log("No song in this album");
                    return;
                }
                else if (checkReleaseExistInList(alb.albumId)) {
                    console.log("Albums/EP already exist in Firebase", alb.name);
                    return;
                }
                else {
                    const dateAlbum = new Date(yield getDateForAlbumWithSong(alb.songs[0]));
                    if (dateAlbum.getFullYear() >= 2023) {
                        let albumData = {
                            idYoutubeMusic: alb.albumId,
                            name: alb.name,
                            image: (_a = alb.thumbnails[alb.thumbnails.length - 1]) === null || _a === void 0 ? void 0 : _a.url,
                            type: 'ALBUM',
                            date: firebase_admin_1.default.firestore.Timestamp.fromDate(dateAlbum),
                            platforms: [],
                            artistsId: yield getArtistIdFromFirebase(artistId),
                            artistsName: artist.name,
                            createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        };
                        let urlYT = "https://music.youtube.com/browse/" + albumData.idYoutubeMusic;
                        albumData.platforms = [urlYT];
                        if (albumData.image === undefined) {
                            albumData.image = "https://cdn-icons-png.flaticon.com/512/26/26805.png";
                        }
                        console.log(albumData);
                        yield setReleaseFromFirebase(albumData, alb.songs);
                    }
                }
            }));
        }));
    });
}
function artistTopSingles(artist, artistId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield artist.topSingles.forEach((single) => __awaiter(this, void 0, void 0, function* () {
            yield getAlbum(single.albumId).then((alb) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (alb.songs[0] === undefined) {
                    // console.log("No song in this album");
                    return;
                }
                else if (checkReleaseExistInList(alb.albumId)) {
                    console.log("Single already exist in Firebase", alb.name);
                    return;
                }
                else {
                    const dateAlbum = new Date(yield getDateForAlbumWithSong(alb.songs[0]));
                    if (dateAlbum.getFullYear() >= 2023) {
                        let albumData = {
                            idYoutubeMusic: alb.albumId,
                            name: alb.name,
                            image: (_a = alb.thumbnails[alb.thumbnails.length - 1]) === null || _a === void 0 ? void 0 : _a.url,
                            type: 'SINGLE',
                            date: firebase_admin_1.default.firestore.Timestamp.fromDate(dateAlbum),
                            platforms: [],
                            artistsId: yield getArtistIdFromFirebase(artistId),
                            artistsName: artist.name,
                            createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        };
                        let urlYT = "https://music.youtube.com/browse/" + albumData.idYoutubeMusic;
                        albumData.platforms = [urlYT];
                        if (albumData.image === undefined) {
                            albumData.image = "https://cdn-icons-png.flaticon.com/512/26/26805.png";
                        }
                        console.log(albumData);
                        yield setReleaseFromFirebase(albumData, alb.songs);
                    }
                }
            }));
        }));
    });
}
function verifyArtist(artistId) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("Artist ID", artistId)
        getArtist(artistId).then((artist) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (checkArtistExistInList(artist.artistId)) {
                let artistUp;
                artistUp = artistList.find((art) => art.idYoutubeMusic === artist.artistId);
                if (artistUp.image !== ((_a = artist.thumbnails[artist.thumbnails.length - 1]) === null || _a === void 0 ? void 0 : _a.url) && ((_b = artist.thumbnails[artist.thumbnails.length - 1]) === null || _b === void 0 ? void 0 : _b.url)) {
                    artistUp.image = (_c = artist.thumbnails[artist.thumbnails.length - 1]) === null || _c === void 0 ? void 0 : _c.url;
                    updateArtistFromFirebase(artistUp);
                }
            }
            yield Promise.all([artistTopAlbums(artist, artistId), artistTopSingles(artist, artistId)]);
            // await artistTopAlbums(artist, artistId)
            // await artistTopSingles(artist, artistId)
        }));
    });
}
function newArtist(artistName) {
    searchArtists(artistName).then((artists) => {
        if (artists.length > 0) {
            artists.forEach((artist) => __awaiter(this, void 0, void 0, function* () {
                yield getArtist(artist.artistId).then((art) => {
                    var _a;
                    console.log(art.name.toLowerCase(), artistName.toLowerCase());
                    // if(!art.description) return;
                    if (!compareStrings(art.name.toLowerCase(), artistName.toLowerCase())) {
                        console.log("Artist name doesn't match");
                        return;
                    }
                    else if (checkArtistExistInList(artist.artistId)) {
                        console.log("Artist already exist in Firebase");
                        return;
                    }
                    else if ((art === null || art === void 0 ? void 0 : art.thumbnails.length) < 1) {
                        // console.log(art)
                        console.log("Artist doesn't have image");
                        return;
                    }
                    else {
                        console.log("Artist doesn't exist in Firebase");
                        let artistData = {
                            idYoutubeMusic: art.artistId,
                            name: art.name,
                            image: (_a = art === null || art === void 0 ? void 0 : art.thumbnails[0]) === null || _a === void 0 ? void 0 : _a.url,
                            description: art.description,
                            type: "SOLO",
                            verified: true,
                            socials: [],
                            platforms: [],
                            styles: [],
                            createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                            updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                        };
                        let urlYT = `https://music.youtube.com/channel/${art.artistId}`;
                        artistData.platforms.push(urlYT);
                        // console.log('artistData\n', artistData)
                        console.log('Artist Validated', artistData.name);
                        setArtistFromFirebase(artistData);
                    }
                });
            }));
        }
    });
}
function getDateForAlbumWithSong(song) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield axios_1.default.get(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${song.videoId}&key=AIzaSyBb-Tgt-UvA-yhRFnB-rpuzdXXaveymfQs`);
        return ((_b = (_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.items[0]) === null || _b === void 0 ? void 0 : _b.snippet.publishedAt) || null;
    });
}
function getArtistIdFromFirebase(idYoutubeMusic) {
    return db.collection("artists").get().then((snapshot) => {
        let artistId = '';
        snapshot.forEach((doc) => {
            if (doc.data().idYoutubeMusic === idYoutubeMusic) {
                artistId = doc.id;
            }
        });
        return artistId;
    });
}
function checkArtistExistInList(artistId) {
    return artistList.some((artist) => artist.idYoutubeMusic === artistId);
}
function checkReleaseExistInList(releaseId) {
    return releaseList.some((release) => release.idYoutubeMusic === releaseId);
}
function compareStrings(str1, str2) {
    if (str1.length !== str2.length) {
        return false;
    }
    for (let i = 0; i < str1.length; i++) {
        if (str1[i] !== str2[i]) {
            return false;
        }
    }
    return true;
}
// Firebase Functions
function deleteArtistFromFirebase(artistId) {
    db.collection("artists").doc(artistId).delete().then(() => {
        console.log("Document successfully deleted!");
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}
const getArtistFromFirebase = function () {
    console.log("getArtistFromFirebase");
    return db.collection("artists").orderBy("name").get().then((snapshot) => {
        let artistList = [];
        snapshot.forEach((doc) => {
            artistList.push(doc.data());
        });
        console.log("artistList is ok");
        return artistList;
    });
};
const getReleasesFromFirebase = function () {
    return db.collection("releases").get().then((snapshot) => {
        let releaseList = [];
        snapshot.forEach((doc) => {
            const res = doc.data();
            res['id'] = doc.id;
            releaseList.push(res);
        });
        return releaseList;
    });
};
//mettre à jour un artiste sur firebase
const updateArtistFromFirebase = function (artist) {
    console.log("updateArtistFromFirebase", artist.name);
    return db.collection("artists").doc(artist.id).update(artist).then(() => {
        console.log("Artist updated to Firebase");
    }).catch((error) => {
        console.error("Error writing document: ", error);
    });
};
const setArtistFromFirebase = function (artist) {
    console.log("setArtistFromFirebase");
    return db.collection("artists").add(artist).then((res) => {
        db.collection("artists").doc(res.id).update({
            id: res.id
        }).then(() => {
            console.log("Artist added to Firebase");
        });
    }).catch((error) => {
        console.error("Error writing document: ", error);
    });
};
const setReleaseFromFirebase = function (release, musics) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("setReleaseFromFirebase");
        return db.collection("releases").add(release).then((res) => __awaiter(this, void 0, void 0, function* () {
            yield db.collection("releases").doc(res.id).update({
                id: res.id
            });
            musics.forEach((music) => __awaiter(this, void 0, void 0, function* () {
                yield db.collection("releases").doc(res.id).collection("musics").add(music);
            }));
        })).catch((error) => {
            console.error("Error writing document: ", error);
        });
    });
};
// YTM Api Functions
function searchArtists(artistToSearch) {
    return __awaiter(this, void 0, void 0, function* () {
        const artists = yield ytm.searchArtists(artistToSearch);
        return artists;
    });
}
function getArtist(artistId) {
    return __awaiter(this, void 0, void 0, function* () {
        const artist = yield ytm.getArtist(artistId);
        return artist;
    });
}
function getVideo(videoId) {
    return __awaiter(this, void 0, void 0, function* () {
        const video = yield ytm.getVideo(videoId);
        return video;
    });
}
function getAlbum(albumId) {
    return __awaiter(this, void 0, void 0, function* () {
        const album = yield ytm.getAlbum(albumId);
        return album;
    });
}
function getSong(songId) {
    return __awaiter(this, void 0, void 0, function* () {
        const song = yield ytm.getSong(songId);
        return song;
    });
}
function getPlaylist(playlistId) {
    return __awaiter(this, void 0, void 0, function* () {
        const playlist = yield ytm.getPlaylist(playlistId);
        return playlist;
    });
}
