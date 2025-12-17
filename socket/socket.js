const SocketUsers = require('../model/socket/socketusers');
const Messages = require('../model/socket/message');
const Users = require('../model/Admin/user_model');
const bookingModel = require('../model/Admin/booking_model')
const socket = require('socket.io');
const reportRequest = require('../model/socket/reportrequest')
const my_function = require('./socketFunction');
var uuid = require('uuid');
const helper = require('../Helper/helper');


module.exports = function (io) {
  io.on('connection', function (socket) {
    console.log(socket.id, "Socket connected");

    socket.on('connect_user', async function (data) {
      try {
        if (!data.userId) {
          error_message = {
            error_message: 'please enter user id first',
          };
          socket.emit('connect_user_listener', error_message);
          return;
        }
        let check_user = await SocketUsers.findOne({ userId: data.userId });
        if (check_user) {
          check_user.socketId = socket.id
          check_user.status = 1
          check_user.onlineStatus = 1
          check_user.save();
        } else {
          await SocketUsers.create({
            userId: data.userId,
            socketId: socket.id,
            status: 1,
            onlineStatus: 1,
            user_connectedTo: null
          });
        }
        success_message = {
          success_message: 'connected successfully',
        };
        socket.emit('connect_user_listener', success_message);
      } catch (error) {
        throw error;
      }
    });

    socket.on('Disconnect', async data => {
      try {
        let socketId = socket.id;
        const check_user = await SocketUsers.findOne({ userId: data.userId });
        if (check_user) {
          await SocketUsers.updateOne({
            status: 0,
            onlineStatus: 0,
            socketId: socketId,
          });
          console.log('User Disconnect successfully');
        }
        const success_message = {
          success_message: 'Disconnect successful',
        };
        socket.emit('discount_user', success_message);
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('send_message', async function (get_data) {

      try {
        var user_data = await Messages.findOne({
          $or: [
            { sender_id: get_data.sender_id, receiver_id: get_data.receiver_id },
            { receiver_id: get_data.sender_id, sender_id: get_data.receiver_id },
          ],
        });
        if (user_data) {
          let create_message = await Messages.create({
            sender_id: get_data.sender_id,
            receiver_id: get_data.receiver_id,
            type: get_data.type,
            message: get_data.message,
            file: get_data.file ? get_data.file : '',
            constant_id: user_data.constant_id,
            created: await my_function.create_time_stamp(),
            updated: await my_function.create_time_stamp(),
          });

          let getdata = await Messages.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'sender_id',
                foreignField: '_id',
                as: 'sender',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'receiver_id',
                foreignField: '_id',
                as: 'receiver',
              },
            },
            { $match: { _id: create_message._id } },
            {
              $project: {
                'sender': 0,       // Exclude sender details
                'receiver': 0,     // Exclude receiver details
              },
            },
          ]);
          
          if (getdata) {
            getdata = getdata.length > 0 ? getdata[0] : {};
            const get_socket_id = await SocketUsers.findOne({
              userId: get_data.receiver_id,
            });
            
            var get_user = await Users.findById( get_data.receiver_id);
            var sender_data = await Users.findById( get_data.sender_id );

            const { device_token, device_type, firstname, lastname, image} = get_user;
            if (get_user) {
              let payload = {};
              payload = sender_data;
              payload.title = "Message Sent ";
              payload.message = `${sender_data.firstname} sent you a message`;
              // payload.senderId = 
              
              let objS = {
                device_type: get_user.device_type,
                device_token: get_user.device_token,
                sender_name: sender_data.firstname,
                sender_image: sender_data.image,
                message : payload.message,
                type:2,
                payload,
                sender_id: get_data.sender_id,
                receiver_id: get_data.receiver_id
              }

              const push = await helper.send_push_notifications(objS);
            }
            socket.emit('send_message_listener', getdata);
            if (get_socket_id) {
              io.to(get_socket_id.socketId).emit('send_message_listener', getdata);
            }
          }
        } else {
          const create_message = await Messages.create({
            sender_id: get_data.sender_id,
            receiver_id: get_data.receiver_id,
            type: get_data.type,
            message: get_data.message,
            file: get_data.file ? get_data.file : '',
            constant_id: await my_function.create_time_stamp(),
            created: await my_function.create_time_stamp(),
            updated: await my_function.create_time_stamp(),
          });
          let getdata = await Messages.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'sender_id',
                foreignField: '_id',
                as: 'sender',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'receiver_id',
                foreignField: '_id',
                as: 'receiver',
              },
            },
            { $match: { _id: create_message._id } },
            {
              $project: {
                'sender': 0,       // Exclude sender details
                'receiver': 0,     // Exclude receiver details
              },
            },
          ]);

          if (getdata) {
            getdata = getdata.length > 0 ? getdata[0] : {};
            const get_socket_id = await SocketUsers.findOne({
              userId: get_data.receiver_id,
            });
            var get_user = await Users.findOne({ _id: get_data.receiver_id });
            var sender_data = await Users.findOne({ _id: get_data.sender_id });
            const { device_token, device_type, firstname, lastname, image } = get_user;
            if (get_user) {
              let payload = {};
              payload = sender_data;
              payload.title = "Message Sent ";
              payload.message = `${sender_data.firstname} sent you a message`;

              let objS = {
                device_type: get_user.device_type,
                device_token: get_user.device_token,
                sender_name: sender_data.firstname,
                sender_image: sender_data.image,
                message : payload.message,
                type:2,
                payload,
                sender_id: get_data.sender_id  ,
                receiver_id: get_data.receiver_id
              }

              if (create_message.sender_id != get_user.constant_id) {
                // helper.send_push_notifications_new(create.message, create);
                const push = await helper.send_push_notifications(objS);
              }
            }
            if (get_socket_id) {
              io.to(get_socket_id.socketId).emit('send_message_listener', getdata);
            }
            socket.emit('send_message_listener', getdata);
          }
        }
      } catch (error) {
        throw error;
      }
    });

    socket.on('get_chat', async function (data) {
      if (data) {
        var get_data_chat = await my_function.getChat(data);

        if (get_data_chat) {
          socket.emit('my_chat', get_data_chat);
        }
      }
    });

    socket.on('chat_list', async function (data) {

      if (data) {
        var get_data_chat_list = await my_function.chatList(data);

        if (get_data_chat_list) {
          socket.emit('chat_list', get_data_chat_list);
        }
      }
    });

    socket.on('report_user', async get_data => {
      try {
        const getrole = await Users.findOne({ id: get_data.userId1 });

        const report = await reportRequest.create({
          reportTo: get_data.reportTo,
          reportBy: get_data.reportBy,
          message: get_data.message,
        });
        success_message = {
          success_message: 'Report send successfully'
        };
        socket.emit('report_user_listener', success_message);
      } catch (error) {
        throw error;
      }
    });

    socket.on("read_unread", async (get_read_status) => {
      try {

        var chatStatus = await my_function.read_unread(get_read_status);

        const updateReadStatusResult = await Messages.updateMany(
          {
            sender_id: get_read_status.sender_id,
            receiver_id: get_read_status.receiver_id,
            readStatus: '0', // Only update unread messages
          },
          {
            readStatus: '1', // Set messages as read
          }
        );
        const response = {
          readStatus: 1,
          message: "message readed successfully",
          sender_id: get_read_status.sender_id,
          receiver_id: get_read_status.receiver_id,
          updatedCount: updateReadStatusResult.nModified, // Number of messages updated
        };
        const get_socket_id = await SocketUsers.findOne({
          userId: get_read_status.receiver_id,
        });
        socket.emit('read_data_status', response);
        io.to(get_socket_id && get_socket_id.socketId).emit('read_data_status', response);
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("update_location", async (get_read_status) => {
      try {
        const updateLocationResult = await Users.updateOne(
          { _id: get_read_status.user_id},
          { location: {
              coordinates: [Number(get_read_status.longitude), Number(get_read_status.latitude)],
            }
          }
        );

        if (get_read_status.bookingId) {

          const response = {
            message: "location update successfully",
            coordinates: {
              longitude: Number(get_read_status.longitude),
              latitude: Number(get_read_status.latitude)
            }
          };

          const get_socket_id = await SocketUsers.findOne({
            userId: get_read_status.user_id,
          });

          socket.emit('update_location_listener', response);
          io.to(get_socket_id && get_socket_id.socketId).emit('update_location_listener', response);
        }
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('clear_chat', async (data) => {
      try {
        // Update messages where deletedId is data.userId
        const updateResult = await Messages.updateMany(
          {
            deletedId: data.userId
          },
          {
            deletedId: 0,
            $or: [
              { senderId: data.userId, receiverId: data.user2Id },
              { senderId: data.user2Id, receiverId: data.userId }
            ]
          }
        );

        // Delete messages where deletedId is not 0 and not data.userId
        const deleteResult = await Messages.deleteMany({
          $or: [
            { senderId: data.userId, receiverId: data.user2Id },
            { senderId: data.user2Id, receiverId: data.userId }
          ],
          $and: [
            {
              deletedId: {
                $ne: 0
              }
            },
            {
              deletedId: {
                $ne: data.userId
              }
            }
          ]
        });

        socket.emit('clear_chat_listener', { success_message: 'Chat clear Successfully' });
      } catch (error) {
        throw error;
      }
    });

    socket.on("job_tracking_status", async (get_read_status) => {
      try {
        
        const socketUserObj = await SocketUsers.findOne({
          userId: get_read_status.receiver_id,
        });
    
        if (socketUserObj) {
          socket.emit('update_tracking_listener', socketUserObj);
          
          if (socketUserObj.socketId) {
            io.to(socketUserObj.socketId).emit('update_tracking_listener', socketUserObj);
          }
        } else {
          console.log("User not found in the database");
        }
      } catch (error) {
        console.error(error);
      }
    });
    
    socket.on('service_request_by_user', async (data) => {   //list of Booking request send by user
      try {
        const { workerId, date } = data;
        const filter = { isBookingCompleted: 1, status: "1", deleted: false }; 

        if (workerId) {
          filter.workerId = workerId;
        }
        if (date) {
          filter.date = date;
        }
      
        const servicerequests = await bookingModel
          .find(filter)
          .populate("userId", "firstname image address")
          .populate("workerId", "firstname image rating")
          .populate("categoryId", "name image")
          .populate("addressId", "address state country");
      
        socket.emit('bookingWorker', { message: "Service requested by user", servicerequests: servicerequests });
          
      } catch (error) {
        console.error(error);
        socket.emit('bookingWorker', { message: "Internal server error" });
      }
    });

    socket.on("update_chat_screen_id", async (data) => {
      try {
        const { sender_id,constant_id } = data;

        await Users.updateOne({
          _id: sender_id
        },{
          $set: {
            constant_id: constant_id  // constant_id = other user id
          }
        })
        socket.emit("update_chat_screen_id", {
          success_message: "updated successfully",
        });
      } catch (error) {
        console.log(error);
        throw error;
      }
    });

  });
};
