<?php

namespace App\Services;

use App\Models\User;
use App\Models\PointHistory;

class RankingService
{
    /**
     * Define the threshold for each tier
     */
    const TIER_BRONZE = 'bronze';
    const TIER_SILVER = 'silver';
    const TIER_GOLD = 'gold';
    const TIER_PLATINUM = 'platinum';

    const THRESHOLD_SILVER = 501;
    const THRESHOLD_GOLD = 2001;
    const THRESHOLD_PLATINUM = 5001;

    /**
     * Add points to a user and log the history
     *
     * @param User $user
     * @param int $points
     * @param string $reason
     * @param mixed|null $model
     * @return void
     */
    public function addPoints(User $user, int $points, string $reason, $model = null): void
    {
        if ($points <= 0) return;

        $user->reward_points += $points;
        
        $this->logPointHistory($user, $points, $reason, $model);
        
        $this->updateUserTier($user);
    }

    /**
     * Deduct points from a user and log the history
     *
     * @param User $user
     * @param int $points
     * @param string $reason
     * @param mixed|null $model
     * @return void
     */
    public function deductPoints(User $user, int $points, string $reason, $model = null): void
    {
        if ($points <= 0) return;

        // Optionally, prevent points from going negative, or allow it.
        // Assuming we allow it or limit to 0 based on business logic. 
        // Let's limit to 0 for safety, or keep it simple and just subtract.
        $user->reward_points -= $points;
        if ($user->reward_points < 0) {
            $user->reward_points = 0;
        }

        $this->logPointHistory($user, -$points, $reason, $model);

        $this->updateUserTier($user);
    }

    /**
     * Check and update the user's membership tier based on their current points
     *
     * @param User $user
     * @return void
     */
    public function updateUserTier(User $user): void
    {
        $points = $user->reward_points;
        $newTier = self::TIER_BRONZE;

        if ($points >= self::THRESHOLD_PLATINUM) {
            $newTier = self::TIER_PLATINUM;
        } elseif ($points >= self::THRESHOLD_GOLD) {
            $newTier = self::TIER_GOLD;
        } elseif ($points >= self::THRESHOLD_SILVER) {
            $newTier = self::TIER_SILVER;
        }

        if ($user->membership_tier !== $newTier) {
            $user->membership_tier = $newTier;
            // In a real app, you might want to dispatch an event here, e.g., TierUpgraded($user)
        }

        $user->save();
    }

    /**
     * Log the point change
     */
    protected function logPointHistory(User $user, int $points, string $reason, $model = null): void
    {
        $history = new PointHistory();
        $history->user_id = $user->id;
        $history->points_changed = $points;
        $history->reason = $reason;

        if ($model) {
            $history->reference_id = $model->id;
            $history->reference_type = get_class($model);
        }

        $history->save();
    }
}
