const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MINEDToken", function () {
  let MINEDToken;
  let minedToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    // Deploy MINEDToken contract
    MINEDToken = await ethers.getContractFactory("MINEDToken");
    minedToken = await MINEDToken.deploy(
      addr1.address, // initialHolder
      addr2.address, // miningRewardsPool
      addr3.address, // stakingRewardsPool
      addr4.address, // researchFund
      addr5.address  // treasury
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await minedToken.owner()).to.equal(owner.address);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await minedToken.name()).to.equal("MINED");
      expect(await minedToken.symbol()).to.equal("MINED");
    });

    it("Should have 18 decimals", async function () {
      expect(await minedToken.decimals()).to.equal(18);
    });

    it("Should mint the correct initial distribution", async function () {
      const totalSupply = await minedToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000000")); // 1 billion tokens

      // Check initial holder balance
      const initialHolderBalance = await minedToken.balanceOf(addr1.address);
      expect(initialHolderBalance).to.equal(ethers.parseEther("500000000")); // 500M tokens

      // Check platform balances
      expect(await minedToken.balanceOf(addr2.address)).to.equal(ethers.parseEther("250000000")); // Mining rewards
      expect(await minedToken.balanceOf(addr3.address)).to.equal(ethers.parseEther("150000000")); // Staking rewards
      expect(await minedToken.balanceOf(addr4.address)).to.equal(ethers.parseEther("50000000"));  // Research fund
      expect(await minedToken.balanceOf(addr5.address)).to.equal(ethers.parseEther("50000000"));  // Treasury
    });

    it("Should set the correct platform addresses", async function () {
      const addresses = await minedToken.getPlatformAddresses();
      expect(addresses[0]).to.equal(addr2.address); // miningRewardsPool
      expect(addresses[1]).to.equal(addr3.address); // stakingRewardsPool
      expect(addresses[2]).to.equal(addr4.address); // researchFund
      expect(addresses[3]).to.equal(addr5.address); // treasury
    });

    it("Should add owner as minter", async function () {
      expect(await minedToken.minters(owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint mining rewards", async function () {
      const mintAmount = ethers.parseEther("1000");
      await minedToken.mintMiningRewards(addr1.address, mintAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500001000"));
    });

    it("Should allow owner to mint staking rewards", async function () {
      const mintAmount = ethers.parseEther("1000");
      await minedToken.mintStakingRewards(addr1.address, mintAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500001000"));
    });

    it("Should allow owner to mint research fund", async function () {
      const mintAmount = ethers.parseEther("1000");
      await minedToken.mintResearchFund(addr1.address, mintAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500001000"));
    });

    it("Should allow owner to mint treasury", async function () {
      const mintAmount = ethers.parseEther("1000");
      await minedToken.mintTreasury(addr1.address, mintAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500001000"));
    });

    it("Should not allow non-owner to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        minedToken.connect(addr1).mintMiningRewards(addr1.address, mintAmount)
      ).to.be.revertedWith("MINED: caller is not a minter");
    });

    it("Should not mint to zero address", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        minedToken.mintMiningRewards(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("MINED: invalid recipient");
    });

    it("Should not mint zero amount", async function () {
      await expect(
        minedToken.mintMiningRewards(addr1.address, 0)
      ).to.be.revertedWith("MINED: invalid amount");
    });

    it("Should not exceed total supply", async function () {
      const remainingSupply = ethers.parseEther("1"); // Only 1 token remaining
      await expect(
        minedToken.mintMiningRewards(addr1.address, remainingSupply + ethers.parseEther("1"))
      ).to.be.revertedWith("MINED: exceeds total supply");
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to add minter", async function () {
      await minedToken.addMinter(addr1.address);
      expect(await minedToken.minters(addr1.address)).to.be.true;
    });

    it("Should allow owner to remove minter", async function () {
      await minedToken.addMinter(addr1.address);
      await minedToken.removeMinter(addr1.address);
      expect(await minedToken.minters(addr1.address)).to.be.false;
    });

    it("Should not allow non-owner to add minter", async function () {
      await expect(
        minedToken.connect(addr1).addMinter(addr2.address)
      ).to.be.revertedWithCustomError(minedToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to remove minter", async function () {
      await minedToken.addMinter(addr1.address);
      await expect(
        minedToken.connect(addr2).removeMinter(addr1.address)
      ).to.be.revertedWithCustomError(minedToken, "OwnableUnauthorizedAccount");
    });

    it("Should not add zero address as minter", async function () {
      await expect(
        minedToken.addMinter(ethers.ZeroAddress)
      ).to.be.revertedWith("MINED: invalid minter address");
    });

    it("Should not add existing minter", async function () {
      await minedToken.addMinter(addr1.address);
      await expect(
        minedToken.addMinter(addr1.address)
      ).to.be.revertedWith("MINED: minter already exists");
    });

    it("Should not remove non-existent minter", async function () {
      await expect(
        minedToken.removeMinter(addr1.address)
      ).to.be.revertedWith("MINED: minter does not exist");
    });

    it("Should allow added minter to mint", async function () {
      await minedToken.addMinter(addr1.address);
      const mintAmount = ethers.parseEther("1000");
      await minedToken.connect(addr1).mintMiningRewards(addr1.address, mintAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500001000"));
    });
  });

  describe("Pausing", function () {
    it("Should allow owner to pause", async function () {
      await minedToken.pause();
      expect(await minedToken.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      await minedToken.pause();
      await minedToken.unpause();
      expect(await minedToken.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        minedToken.connect(addr1).pause()
      ).to.be.revertedWithCustomError(minedToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow transfers when paused", async function () {
      await minedToken.pause();
      await expect(
        minedToken.transfer(addr2.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(minedToken, "EnforcedPause");
    });
  });

  describe("Token Info", function () {
    it("Should return correct token information", async function () {
      const tokenInfo = await minedToken.getTokenInfo();
      expect(tokenInfo[0]).to.equal("MINED"); // name
      expect(tokenInfo[1]).to.equal("MINED"); // symbol
      expect(tokenInfo[2]).to.equal(18); // decimals
      expect(tokenInfo[3]).to.equal(ethers.parseEther("1000000000")); // total supply
      expect(tokenInfo[4]).to.equal(ethers.parseEther("950000000")); // circulating supply (total - treasury)
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      await minedToken.connect(addr1).burn(burnAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("499999000"));
    });

    it("Should allow users to burn tokens from other addresses with allowance", async function () {
      const burnAmount = ethers.parseEther("1000");
      await minedToken.connect(addr1).approve(addr2.address, burnAmount);
      await minedToken.connect(addr2).burnFrom(addr1.address, burnAmount);
      expect(await minedToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("499999000"));
    });
  });

  describe("Events", function () {
    it("Should emit MinterAdded event", async function () {
      await expect(minedToken.addMinter(addr1.address))
        .to.emit(minedToken, "MinterAdded")
        .withArgs(addr1.address);
    });

    it("Should emit MinterRemoved event", async function () {
      await minedToken.addMinter(addr1.address);
      await expect(minedToken.removeMinter(addr1.address))
        .to.emit(minedToken, "MinterRemoved")
        .withArgs(addr1.address);
    });

    it("Should emit MiningRewardsMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(minedToken.mintMiningRewards(addr1.address, mintAmount))
        .to.emit(minedToken, "MiningRewardsMinted")
        .withArgs(addr1.address, mintAmount);
    });

    it("Should emit StakingRewardsMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(minedToken.mintStakingRewards(addr1.address, mintAmount))
        .to.emit(minedToken, "StakingRewardsMinted")
        .withArgs(addr1.address, mintAmount);
    });

    it("Should emit ResearchFundMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(minedToken.mintResearchFund(addr1.address, mintAmount))
        .to.emit(minedToken, "ResearchFundMinted")
        .withArgs(addr1.address, mintAmount);
    });

    it("Should emit TreasuryMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(minedToken.mintTreasury(addr1.address, mintAmount))
        .to.emit(minedToken, "TreasuryMinted")
        .withArgs(addr1.address, mintAmount);
    });
  });
});
