const hre = require("hardhat");

async function main() {
  console.log("Deploying ProjectVoting Contract...");

  const Voting = await hre.ethers.getContractFactory("ProjectVoting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log(`Voting Contract successfully deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
