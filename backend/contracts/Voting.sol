// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Project Voting System
 * @dev Manages the voting logic for approving student projects by faculty
 */
contract ProjectVoting {
    
    // Structure to hold project details
    struct Project {
        uint256 id;
        string title;
        bool isApproved;
        bool isRejected;
        uint256 approveVotes;
        uint256 rejectVotes;
        mapping(address => bool) hasVoted;
    }

    // State Variables
    address public admin;
    uint256 public projectCount;
    
    // Mappings
    mapping(address => bool) public isFaculty;
    mapping(uint256 => Project) public projects;

    // Events
    event FacultyAdded(address facultyAddress);
    event FacultyRemoved(address facultyAddress);
    event ProjectAdded(uint256 projectId, string title);
    event Voted(uint256 projectId, address faculty, bool approve);
    event ProjectStatusChanged(uint256 projectId, string status);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyFaculty() {
        require(isFaculty[msg.sender], "Only authorized faculty can vote");
        _;
    }

    modifier projectExists(uint256 _projectId) {
        require(_projectId > 0 && _projectId <= projectCount, "Project does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Admin adds a new faculty member allowed to vote
     */
    function addFaculty(address _facultyAddress) external onlyAdmin {
        require(!isFaculty[_facultyAddress], "Address is already faculty");
        isFaculty[_facultyAddress] = true;
        emit FacultyAdded(_facultyAddress);
    }

    /**
     * @dev Admin removes a faculty member
     */
    function removeFaculty(address _facultyAddress) external onlyAdmin {
        require(isFaculty[_facultyAddress], "Address is not faculty");
        isFaculty[_facultyAddress] = false;
        emit FacultyRemoved(_facultyAddress);
    }

    /**
     * @dev Backend adds a new pending project to the blockchain
     */
    function addProject(string memory _title) external onlyAdmin returns (uint256) {
        projectCount++;
        Project storage newProject = projects[projectCount];
        newProject.id = projectCount;
        newProject.title = _title;
        newProject.isApproved = false;
        newProject.isRejected = false;
        newProject.approveVotes = 0;
        newProject.rejectVotes = 0;

        emit ProjectAdded(projectCount, _title);
        return projectCount;
    }

    /**
     * @dev Faculty votes on a project. 
     * Requires 3 approvals to be 'Approved', or 2 rejections to be 'Rejected'
     */
    function vote(uint256 _projectId, bool _approve) external onlyFaculty projectExists(_projectId) {
        Project storage p = projects[_projectId];
        
        require(!p.hasVoted[msg.sender], "You have already voted on this project");
        require(!p.isApproved && !p.isRejected, "Voting is closed for this project");

        p.hasVoted[msg.sender] = true;

        if (_approve) {
            p.approveVotes++;
        } else {
            p.rejectVotes++;
        }

        emit Voted(_projectId, msg.sender, _approve);

        // Check for resolution (e.g., Simple majority threshold logic)
        // In a real scenario, these thresholds might be dynamic based on total faculty
        if (p.approveVotes >= 3) {
            p.isApproved = true;
            emit ProjectStatusChanged(_projectId, "Approved");
        } else if (p.rejectVotes >= 2) {
            p.isRejected = true;
            emit ProjectStatusChanged(_projectId, "Rejected");
        }
    }

    /**
     * @dev Get basic project details
     */
    function getProjectDetails(uint256 _projectId) external view projectExists(_projectId) returns (
        uint256 id,
        string memory title,
        bool isApproved,
        bool isRejected,
        uint256 approveVotes,
        uint256 rejectVotes
    ) {
        Project storage p = projects[_projectId];
        return (
            p.id,
            p.title,
            p.isApproved,
            p.isRejected,
            p.approveVotes,
            p.rejectVotes
        );
    }
}
