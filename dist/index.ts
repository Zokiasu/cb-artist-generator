import YTMusic from 'ytmusic-api';
import admin from "firebase-admin";
import axios from 'axios';
import { FieldValue } from '@google-cloud/firestore';

const db = require("../javascript/db");

const ytm = new YTMusic();

let artistList: any[] = []
let releaseList: any[] = []

interface artistTemplate {
  idYoutubeMusic: string,
  name: string,
  image: string,
  type: string,
  description: string,
  verified: boolean,
  socials: string[],
  platforms: string[],
  styles: string[],
  createdAt: FieldValue,
  updatedAt: FieldValue
}

interface releaseTemplate {
  idYoutubeMusic: string,
  name: string,
  image: string,
  type: string,
  date: FieldValue,
  platforms: string[],
  artistsId: string,
  artistsName: string,
  createdAt: FieldValue,
  updatedAt: FieldValue
}

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What is the name of the artist? ', (entry: string) => {
  console.log(`You entered: ${entry}`);
  ytm.initialize().then(async () => {
    artistList = await getArtistFromFirebase()
    releaseList = await getReleasesFromFirebase()

    // si l'utilisateur entre un nom d'artiste lancer la recherche d'artiste
    if(entry) {
      console.log('Entry', entry)
      newArtist(entry)
    } 
    // sinon lancer l'actualisation des nouvelles releases des artistes existant
    else {
      for (let index = artistList.length-1; index >= 0; index--) {
        if(artistList[index].idYoutubeMusic) {
          setTimeout(async () => {
            await verifyArtist(artistList[index].idYoutubeMusic)
          }, index * 1000);  // attendre 1 seconde avant chaque itération
        }
      }
    }
  });
  rl.close();
});


// Main function

async function artistTopAlbums(artist: any, artistId: string) {

  await artist.topAlbums.forEach(async (album: any) => {
    await getAlbum(album.albumId).then(async (alb) => {
      if(alb.songs[0] === undefined) {
        // console.log("No song in this album");
        return;
      } 
      else if(checkReleaseExistInList(alb.albumId)) {
        console.log("Albums/EP already exist in Firebase", alb.name); 
        return;
      }
      else {
        const dateAlbum = new Date(await getDateForAlbumWithSong(alb.songs[0]))
        if(dateAlbum.getFullYear() >= 2023) {
          let albumData: releaseTemplate = {
            idYoutubeMusic: alb.albumId,
            name: alb.name,
            image: alb.thumbnails[alb.thumbnails.length-1]?.url,
            type: 'ALBUM',
            date: admin.firestore.Timestamp.fromDate(dateAlbum),
            platforms: [],
            artistsId: await getArtistIdFromFirebase(artistId),
            artistsName: artist.name,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }
          let urlYT = "https://music.youtube.com/browse/" + albumData.idYoutubeMusic
          albumData.platforms = [urlYT]
          if(albumData.image === undefined) {
            albumData.image = "https://cdn-icons-png.flaticon.com/512/26/26805.png"
          }
          console.log(albumData)
          await setReleaseFromFirebase(albumData, alb.songs)
        }
      }
    })
  })
}

async function artistTopSingles(artist: any, artistId: string) {
  
  await artist.topSingles.forEach(async (single: any) => {
    await getAlbum(single.albumId).then(async (alb) => {
      if(alb.songs[0] === undefined) {
        // console.log("No song in this album");
        return;
      } 
      else if(checkReleaseExistInList(alb.albumId)) {
        console.log("Single already exist in Firebase", alb.name); 
        return;
      } else {
        const dateAlbum = new Date(await getDateForAlbumWithSong(alb.songs[0]))
        if(dateAlbum.getFullYear() >= 2023) {
          let albumData: releaseTemplate = {
            idYoutubeMusic: alb.albumId,
            name: alb.name,
            image: alb.thumbnails[alb.thumbnails.length-1]?.url,
            type: 'SINGLE',
            date: admin.firestore.Timestamp.fromDate(dateAlbum),
            platforms: [],
            artistsId: await getArtistIdFromFirebase(artistId),
            artistsName: artist.name,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }
          let urlYT = "https://music.youtube.com/browse/" + albumData.idYoutubeMusic
          albumData.platforms = [urlYT]
          if(albumData.image === undefined) {
            albumData.image = "https://cdn-icons-png.flaticon.com/512/26/26805.png"
          }
          console.log(albumData)
          await setReleaseFromFirebase(albumData, alb.songs)
        }
      }
    })
  })
}

async function verifyArtist(artistId: string) {
  // console.log("Artist ID", artistId)
  getArtist(artistId).then(async (artist) => {
    if(checkArtistExistInList(artist.artistId)) {
      let artistUp: artistTemplate;
      artistUp = artistList.find((art: any) => art.idYoutubeMusic === artist.artistId)

      if(artistUp.image !== artist.thumbnails[artist.thumbnails.length-1]?.url && artist.thumbnails[artist.thumbnails.length-1]?.url) {
        artistUp.image = artist.thumbnails[artist.thumbnails.length-1]?.url
        updateArtistFromFirebase(artistUp)
      }
    }
    await Promise.all([artistTopAlbums(artist, artistId), artistTopSingles(artist, artistId)]);
    // await artistTopAlbums(artist, artistId)
    // await artistTopSingles(artist, artistId)
  })
}

function newArtist(artistName: string) {
  searchArtists(artistName).then((artists) => {
    if(artists.length > 0) {
      artists.forEach(async (artist: any) => {
        await getArtist(artist.artistId).then((art) => {
          console.log(art.name.toLowerCase(), artistName.toLowerCase())
          // if(!art.description) return;
          if(!compareStrings(art.name.toLowerCase(), artistName.toLowerCase())) {
            console.log("Artist name doesn't match")
            return;
          }
          else if(checkArtistExistInList(artist.artistId)) {
            console.log("Artist already exist in Firebase")
            return;
          }
          else if (art?.thumbnails.length < 1) {
            // console.log(art)
            console.log("Artist doesn't have image")
            return;
          }
          else {
            console.log("Artist doesn't exist in Firebase")
            let artistData: artistTemplate = {
              idYoutubeMusic: art.artistId,
              name: art.name,
              image: art?.thumbnails[0]?.url,
              description: art.description,
              type: "SOLO",
              verified: true,
              socials: [],
              platforms: [],
              styles: [],
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }

            let urlYT = `https://music.youtube.com/channel/${art.artistId}`
            artistData.platforms.push(urlYT)
            
            // console.log('artistData\n', artistData)
            console.log('Artist Validated', artistData.name)
            setArtistFromFirebase(artistData)
          }
        })
      })
    }
  })
}

async function getDateForAlbumWithSong(song: any) {
  let res = await axios.get(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${song.videoId}&key=AIzaSyBb-Tgt-UvA-yhRFnB-rpuzdXXaveymfQs`)
  return res?.data?.items[0]?.snippet.publishedAt || null

}

function getArtistIdFromFirebase(idYoutubeMusic: string) {
  return db.collection("artists").get().then((snapshot: any[]) => {
    let artistId: string = ''
    snapshot.forEach((doc: any) => {
      if(doc.data().idYoutubeMusic === idYoutubeMusic) {
        artistId = doc.id
      }
    })
    return artistId
  })
}

function checkArtistExistInList(artistId: string) {
  return artistList.some((artist) => artist.idYoutubeMusic === artistId);
}

function checkReleaseExistInList(releaseId: string) {
  return releaseList.some((release) => release.idYoutubeMusic === releaseId);
}

function compareStrings(str1: string, str2: string) {
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

function deleteArtistFromFirebase(artistId: string) {
  db.collection("artists").doc(artistId).delete().then(() => {
    console.log("Document successfully deleted!");
  }).catch((error: any) => {
    console.error("Error removing document: ", error);
  });
}

const getArtistFromFirebase = function(){
  console.log("getArtistFromFirebase")
  return db.collection("artists").orderBy("name").get().then((snapshot: any[]) => {
    let artistList: any[] = []
    snapshot.forEach((doc: { data: () => any; }) => {
      artistList.push(doc.data())
    })
    console.log("artistList is ok")
    return artistList
  })
}

const getReleasesFromFirebase = function(){
  return db.collection("releases").get().then((snapshot: any[]) => {
    let releaseList: any[] = []
    snapshot.forEach((doc: { data: () => any; id: any; }) => {
      const res = doc.data()
      res['id'] = doc.id
      releaseList.push(res)
    })
    return releaseList
  })
}

//mettre à jour un artiste sur firebase
const updateArtistFromFirebase = function(artist: any) {
  console.log("updateArtistFromFirebase", artist.name)
  return db.collection("artists").doc(artist.id).update(artist).then(() => {
    console.log("Artist updated to Firebase")
  }).catch((error: any) => {
    console.error("Error writing document: ", error);
  });
}

const setArtistFromFirebase = function(artist: any) {
  console.log("setArtistFromFirebase")
  return db.collection("artists").add(artist).then((res: { id: any; }) => {
    db.collection("artists").doc(res.id).update({
      id: res.id
    }).then(() => {
      console.log("Artist added to Firebase")
    })
  }).catch((error: any) => {
      console.error("Error writing document: ", error);
  });
}

const setReleaseFromFirebase = async function(release: any, musics: any[]) {
  console.log("setReleaseFromFirebase")
  return db.collection("releases").add(release).then(async (res: { id: any; }) => {
    await db.collection("releases").doc(res.id).update({
      id: res.id
    })
    musics.forEach(async (music: any) => {
      await db.collection("releases").doc(res.id).collection("musics").add(music)
    })
  }).catch((error: any) => {
    console.error("Error writing document: ", error);
  });
}

// YTM Api Functions

async function searchArtists(artistToSearch: string) {
  const artists = await ytm.searchArtists(artistToSearch);
  return artists;
}

async function getArtist(artistId: string) {
  const artist = await ytm.getArtist(artistId);
  return artist;
}

async function getVideo(videoId: string) {
  const video = await ytm.getVideo(videoId);
  return video;
}

async function getAlbum(albumId: string) {
  const album = await ytm.getAlbum(albumId);
  return album;
}

async function getSong(songId: string) {
  const song = await ytm.getSong(songId);
  return song;
}

async function getPlaylist(playlistId: string) {
  const playlist = await ytm.getPlaylist(playlistId);
  return playlist;
}

