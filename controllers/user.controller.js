const UserModel = require("../models/user.model");
const ObjectID = require("mongoose").Types.ObjectId;

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.userInfo = async (req, res) => {
  console.log(req.params);

  if (!ObjectID.isValid(req.params.id)) {
    return res.status(400).send("Id unknown: " + req.params.id);
  }

  try {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(400).send("Id unknown: " + req.params.id);
  }

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          bio: req.body.bio,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(400).send("Id unknown: " + req.params.id);
  }

  try {
    const result = await UserModel.deleteOne({ _id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Successfully deleted." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.follow = async (req, res) => {
  if (
    !ObjectID.isValid(req.params.id) ||
    !ObjectID.isValid(req.body.idToFollow)
  ) {
    return res.status(400).send("Id unknown: " + req.params.id);
  }

  try {
    // add to the following list of current user
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { following: req.body.idToFollow } },
      { new: true, upsert: true }
    ).select("-password");

    // add to the followers list of the target user
    await UserModel.findByIdAndUpdate(
      req.body.idToFollow,
      { $addToSet: { followers: req.params.id } },
      { new: true, upsert: true }
    );

    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.unfollow = async (req, res) => {
  const { id } = req.params;
  const { idToUnfollow } = req.body;

  if (!ObjectID.isValid(id) || !ObjectID.isValid(idToUnfollow)) {
    return res.status(400).send("Id unknown: " + id);
  }

  try {
    // remove from the following list of current user
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $pull: { following: idToUnfollow } },
      { new: true, upsert: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // remove from the followers list of the target user
    await UserModel.findByIdAndUpdate(
      idToUnfollow,
      { $pull: { followers: id } },
      { new: true, upsert: true }
    );

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
