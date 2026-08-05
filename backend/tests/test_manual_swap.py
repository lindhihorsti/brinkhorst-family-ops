import unittest

from app.services.swap_service import split_manual_days


class TestSplitManualDays(unittest.TestCase):
    def test_manual_honored_and_randoms_exclude_them(self):
        manual_valid = {"2": "r-aaa", "5": "r-bbb", "9": "r-zzz"}  # "9" not in range
        manual, random_keys = split_manual_days(["1", "2", "3", "4", "5"], manual_valid)

        # only in-range manual picks survive, in the caller's day order
        self.assertEqual(manual, {"2": "r-aaa", "5": "r-bbb"})
        # random slots are exactly the non-manual days
        self.assertEqual(random_keys, ["1", "3", "4"])
        # manual and random are disjoint -> a random day can never carry a manual pick
        self.assertFalse(set(manual) & set(random_keys))

    def test_no_manual(self):
        manual, random_keys = split_manual_days(["2", "5", "7"], {})
        self.assertEqual(manual, {})
        self.assertEqual(random_keys, ["2", "5", "7"])


if __name__ == "__main__":
    unittest.main()
