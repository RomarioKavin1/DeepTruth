// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract VideoRegistry {
    struct Video {
        string videoCID;
        string transcriptCID;
        address creator;
    }
    mapping(string => Video) private videos;
    mapping(address => string[]) private creatorToVideos;
    event VideoUploaded(string videoCID, string transcriptCID, address indexed creator);

    function uploadVideo(string calldata videoCID, string calldata transcriptCID) external {
        require(bytes(videoCID).length > 0, "Video CID is required");
        require(bytes(transcriptCID).length > 0, "Transcript CID is required");
        require(videos[videoCID].creator == address(0), "Video already exists");

        videos[videoCID] = Video({
            videoCID: videoCID,
            transcriptCID: transcriptCID,
            creator: msg.sender
        });

        creatorToVideos[msg.sender].push(videoCID);

        emit VideoUploaded(videoCID, transcriptCID, msg.sender);
    }

    function getVideoByCID(string calldata videoCID) external view returns (Video memory) {
        require(videos[videoCID].creator != address(0), "Video not found");
        return videos[videoCID];
    }

    function getVideosByAddress(address creator) external view returns (Video[] memory) {
        string[] memory cids = creatorToVideos[creator];
        Video[] memory result = new Video[](cids.length);

        for (uint i = 0; i < cids.length; i++) {
            result[i] = videos[cids[i]];
        }

        return result;
    }
}