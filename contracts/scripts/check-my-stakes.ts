import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function checkMyStakes() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  // Current contract address from .env
  const examStakingAddress = "0xa147C9A89f50771A89dD421A614A8570f765a20E";
  
  // Your test addresses from .env
  const testStudent = "0xCD4D36e9b762c59C4475C7374924621800188cd9";
  const testVerifier = "0x9BB37D447e3d07031Da0D203b67E851aad328372";
  
  console.log("🔍 Checking YOUR Actual Stakes");
  console.log("==============================");
  console.log("📍 Contract:", examStakingAddress);
  console.log("👤 Student Address:", testStudent);
  console.log("👨‍🏫 Verifier Address:", testVerifier);
  
  // Event signatures for filtering
  const stakedTopic = ethers.keccak256(ethers.toUtf8Bytes("Staked(bytes32,address,address,uint256,uint256)"));
  const finalizedTopic = ethers.keccak256(ethers.toUtf8Bytes("ExamFinalized(bytes32,address[])"));
  const claimedTopic = ethers.keccak256(ethers.toUtf8Bytes("Claimed(bytes32,address,uint256)"));
  
  const examStakingABI = [
    "event Staked(bytes32 indexed examId, address indexed staker, address indexed candidate, uint256 amount, uint256 predictedScore)",
    "event ExamFinalized(bytes32 indexed examId, address[] winners)",
    "event Claimed(bytes32 indexed examId, address indexed staker, uint256 payout)",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function hasClaimed(bytes32 examId, address staker) external view returns (bool)",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(examStakingAddress, examStakingABI, provider);
  const iface = new ethers.Interface(examStakingABI);

  try {
    // Get recent blocks but in smaller chunks due to Alchemy free tier
    const latestBlock = await provider.getBlockNumber();
    console.log(`📊 Latest block: ${latestBlock}`);
    
    const userStakes = new Map();
    const batchSize = 10; // Small batch for free tier
    const totalBlocks = 200; // Check last 200 blocks
    
    // Get all Staked events where you are the staker in small batches
    for (let i = 0; i < totalBlocks; i += batchSize) {
      const fromBlock = Math.max(0, latestBlock - totalBlocks + i);
      const toBlock = Math.min(latestBlock, fromBlock + batchSize - 1);
      
      console.log(`📊 Scanning blocks ${fromBlock} to ${toBlock}`);
      
      const stakedFilter = {
        address: examStakingAddress,
        topics: [
          stakedTopic,
          null, // examId (any)
          ethers.zeroPadValue(testStudent, 32) // your address as staker
        ],
        fromBlock: fromBlock,
        toBlock: toBlock
      };
      
      try {
        const stakedEvents = await provider.getLogs(stakedFilter);
        
        if (stakedEvents.length > 0) {
          console.log(`📈 Found ${stakedEvents.length} stakes in this batch`);
          
          // Process these events
          for (const event of stakedEvents) {
            const parsed = iface.parseLog(event);
            if (parsed) {
              const examId = parsed.args.examId;
              const candidate = parsed.args.candidate;
              const amount = parsed.args.amount;
              const predictedScore = parsed.args.predictedScore;
              
              const block = await provider.getBlock(event.blockNumber);
              const timestamp = block ? new Date(block.timestamp * 1000) : new Date();
              
              console.log(`\n📋 STAKE FOUND:`);
              console.log(`   📅 Date: ${timestamp.toLocaleString()}`);
              console.log(`   🎯 Exam ID: ${examId}`);
              console.log(`   👤 Candidate: ${candidate}`);
              console.log(`   💰 Amount: ${ethers.formatUnits(amount, 6)} PYUSD`);
              console.log(`   📊 Predicted Score: ${predictedScore}`);
              
              // Store for later analysis
              if (!userStakes.has(examId)) {
                userStakes.set(examId, []);
              }
              userStakes.get(examId).push({
                candidate,
                amount,
                predictedScore,
                timestamp: timestamp.toISOString()
              });
              
              // Check exam status
              try {
                const [verifier, stakeDeadline, finalized, canceled] = await contract.getExam(examId);
                console.log(`   🏁 Status: ${finalized ? 'FINALIZED' : 'ONGOING'} ${canceled ? '(CANCELED)' : ''}`);
                
                if (finalized) {
                  const isWinner = await contract.isWinner(examId, candidate);
                  const hasClaimed = await contract.hasClaimed(examId, testStudent);
                  
                  console.log(`   🏆 Winner: ${isWinner ? 'YES' : 'NO'}`);
                  console.log(`   💸 Claimed: ${hasClaimed ? 'YES' : 'NO'}`);
                  
                  if (isWinner && !hasClaimed) {
                    console.log(`   🎉 CLAIMABLE REWARDS AVAILABLE!`);
                  }
                }
              } catch (e) {
                console.log(`   ❌ Could not check exam status`);
              }
            }
          }
        }
      } catch (batchError: any) {
        console.log(`⚠️  Error in batch ${fromBlock}-${toBlock}:`, batchError.message);
        continue;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Generate win rate data
    if (userStakes.size > 0) {
      console.log(`\n📊 WIN RATE ANALYSIS`);
      console.log(`====================`);
      
      let totalExams = 0;
      let wonExams = 0;
      const monthlyData = new Map();
      
      for (const [examId, stakes] of userStakes) {
        try {
          const [, , finalized] = await contract.getExam(examId);
          
          if (finalized) {
            totalExams++;
            
            // Check if won any candidate in this exam
            let wonThisExam = false;
            for (const stake of stakes) {
              const isWinner = await contract.isWinner(examId, stake.candidate);
              if (isWinner) {
                wonThisExam = true;
                break;
              }
            }
            
            if (wonThisExam) wonExams++;
            
            // Group by month for chart data
            const date = new Date(stakes[0].timestamp);
            const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, { won: 0, total: 0 });
            }
            
            const month = monthlyData.get(monthKey);
            month.total += 1;
            if (wonThisExam) month.won += 1;
          }
        } catch (e) {
          // Skip if can't check
        }
      }
      
      const winRate = totalExams > 0 ? Math.round((wonExams / totalExams) * 100) : 0;
      console.log(`📈 Overall Win Rate: ${winRate}% (${wonExams}/${totalExams})`);
      
      // Chart data
      console.log(`\n📊 CHART DATA FOR YOUR FRONTEND:`);
      const chartData = Array.from(monthlyData.entries()).map(([month, data]) => ({
        date: month,
        winRate: Math.round((data.won / data.total) * 100),
        stakesWon: data.won,
        stakesTotal: data.total
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(JSON.stringify(chartData, null, 2));
      
    } else {
      console.log(`\n❌ No stakes found for your address`);
      console.log(`💡 Make sure you've participated in some exams first!`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkMyStakes().catch(console.error);