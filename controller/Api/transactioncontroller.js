const transactionModel = require('../../model/Admin/transaction_model')
const { Validator } = require('node-input-validator');
let helper = require('../../Helper/helper');
const user_model = require('../../model/Admin/user_model');
const job_model = require('../../model/Admin/job_model');
let addCost_model = require('../../model/Admin/addCost_model')
let serviceFees = require('../../model/Admin/service_fee_model')

module.exports = {

  payment_transaction: async(req, res)=> {
      try {
          const v = new Validator( req.body, {
              transactionId: "required",
              jobId: "required"
          })
        
          let error = await helper.checkValidation(v);
          if (error) {
            return helper.failed(res, error);
          }
          let userId = req.user._id;
          const transactionstatus = await transactionModel.create({
              userId,
              ...req.body
          })

          let jobId = transactionstatus.jobId;
          const jobData = await job_model.findById({_id: jobId})  // job price

          const addCostData = await addCost_model.findOne({ jobId });  // add cost
          if (!addCostData){
            return helper.failed(res, "Add cost not found for this job")
          }
          const adminfee = await serviceFees.findOne()  //admin fees

          let workerFinalAmount = jobData.price;
          if (addCostData.amount && jobData.price) {
            jobPrice_addCost = Number(addCostData.amount) + Number(jobData.price)  //job price with add cost
            adminCharges = (Number(jobData.price)) * adminfee.service_charge / 100;   //admin charges
            workerFinalAmount = Number(addCostData.amount) + Number(jobData.price) - adminCharges;   // worker final amount
        }
          
        return helper.success(res, "transaction", {transactionstatus, jobPrice_addCost, workerFinalAmount, adminCharges})
      } catch (error) {
          console.log(error)
      }
  },

  transaction_list: async (req, res) => {
      try {
        const userId = req.user._id
        let usertransaction = await transactionModel.find({ userId: userId}).sort({ createdAt: -1 })
        .populate("userId", 'firstname image')
        .populate("jobId", 'job_title price workerId')
  
        if (!usertransaction) {
          return helper.failed(res, "Transaction not found");
        }
  
        return helper.success(res, 'User transaction list', usertransaction);
      } catch (error) {
        console.log(error)
      }
  },

  job_cancellation_charges: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await user_model.findOne({ _id: userId });
  
      if (!user) {
        return helper.failed(res, "User not found");
      }
  
      if (user.user_job_cancellation_fee === "0") {
        return helper.success(res, "User has not cancelled any job");
      } else {
        const cancellationCount = parseInt(user.user_job_cancellation_fee);
        return helper.success(res, `User has cancelled ${cancellationCount} job${cancellationCount !== 1 ? 's' : ''}`, user);
      }
    } catch (error) {
      return helper.failed(res, "Something went wrong");
    }
  },

  worker_transaction_history: async (req, res) => {
    try {
      const workerId = req.user._id;
      
      const jobs = await job_model.find({ workerId });
  
      if (!jobs || jobs.length == 0) {
        return helper.error2(res, 'No jobs found for the worker.');
      }
  
      const modifiedTransactions = [];    // Initialize an array to store modified transactions
  
      for (const job of jobs) {
       
        const addCost = await addCost_model.findOne({ jobId: job });    // Find additional cost for the job
  
        const adminfee = await serviceFees.findOne();  // Find admin fee
  
        const adminCharges = (Number(job.price)) * adminfee.service_charge / 100;   // Calculate admin charges
  
        const jobTransaction = await transactionModel.findOne({ jobId: job }).populate("jobId", "job_title price");
  
        const workerFinalAmount = addCost ? (Number(addCost.amount) + Number(job.price) - adminCharges) : null;
  
        const modifiedTransaction = {
          jobTransaction,
          addCost: addCost ? addCost.amount : null,
          adminCharges,
          workerFinalAmount
        };

        modifiedTransactions.push(modifiedTransaction);  // Push the modified transaction to the array
      }
  
      return helper.success(res, 'Worker transaction list', modifiedTransactions);
    } catch (error) {
      console.error(error);
      return helper.error(res, 'An error occurred while fetching worker transaction history.');
    }
  }
  

}
